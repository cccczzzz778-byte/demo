import { expect, test } from 'bun:test';
import { handleAdminApi, type AdminApiDeps } from '../super-admin-api.ts';
import type { AccessProfile } from '../rbac.ts';

const profile: AccessProfile = {username:'district-admin',role:'ADMIN',scopeType:'district',districtId:'Olot',facilityId:null,controlMode:null,active:true};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});

test('diagnostic credential forward payload', async () => {
  const calls:any[]=[];
  const innerFetch=async (r:Request)=>{
    const u=new URL(r.url); let body:any;
    if(r.method!=='GET') try{body=await r.clone().json()}catch{}
    calls.push({path:u.pathname,method:r.method,body});
    if(u.pathname==='/api/v1/me') return json({id:'a1',username:'district-admin',role:'ADMIN',institutionId:null,scope:null});
    if(u.pathname==='/api/v1/institutions') return json({institutions:[{id:'olot-op',name:'Olot OP',type:'OP',scope:'Olot',parent_id:null}]});
    if(u.pathname==='/api/v1/admin/users'&&r.method==='POST') return json({ok:true,id:'new',username:body?.username},201);
    return json({error:'not found'},404);
  };
  const deps:AdminApiDeps={getProfile:async()=>profile,listAdminProfiles:async()=>[],upsertAdminProfile:async()=>{},appendAudit:async()=>{},createAdminAccount:async()=>({id:'x',username:'x'}),listPresence:async()=>[],revokeSession:async()=>{},listSecurityEvents:async()=>[],listAudit:async()=>[],getHealth:async()=>({}),updateHierarchy:async()=>{}};
  const request=new Request('https://app.test/api/control/credentials',{method:'POST',headers:{cookie:'ssb_session=x','content-type':'application/json'},body:JSON.stringify({institutionId:'olot-op',username:'u',password:'abcdefgh'})});
  const response=await handleAdminApi(request,innerFetch,deps);
  console.log('DIAGNOSTIC_CALLS',JSON.stringify(calls));
  expect(response?.status).toBe(201);
  expect(calls.find(c=>c.path==='/api/v1/admin/users'&&c.method==='POST')?.body).toEqual({institutionId:'olot-op',role:'DATA_ENTRY',username:'u',password:'abcdefgh'});
});
