import { describe, expect, test } from 'bun:test';
import { handleAdminApi, type AdminApiDeps } from '../super-admin-api.ts';
import type { AccessProfile } from '../rbac.ts';

function req(path:string,method='GET',body?:unknown){return new Request('https://app.test'+path,{method,headers:{cookie:'ssb_session=x','content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})}
function json(data:any,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
const superP:AccessProfile={username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:null,active:true};
const adminP:AccessProfile={username:'olot-admin',role:'ADMIN',scopeType:'district',districtId:'Olot',facilityId:null,controlMode:null,active:true};
const viewerP:AccessProfile={username:'viewer',role:'CONTROL_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:'viewer',active:true};

function harness(profile:AccessProfile|null, actor={id:'a1',username:profile?.username||'x',role:'ADMIN',institutionId:null,scope:null}){
  const calls:{path:string,method:string,body?:any}[]=[];
  const innerFetch=async (r:Request)=>{
    const u=new URL(r.url); let body:any=undefined; if(r.method!=='GET') try{body=await r.clone().json()}catch{}
    calls.push({path:u.pathname,method:r.method,body});
    if(u.pathname==='/api/v1/me') return profile?json(actor):json({error:'Unauthorized'},401);
    if(u.pathname==='/api/v1/institutions') return json({institutions:[{id:'olot-op',name:'Olot OP',type:'OP',scope:'Olot'},{id:'romitan-op',name:'Romitan OP',type:'OP',scope:'Romitan'},{id:'dpm1',name:'Onkologiya',type:'DPM',scope:'Buxoro shahri'}]});
    if(u.pathname==='/api/v1/admin/users'&&r.method==='GET') return json({users:[{id:'u1',username:'op1',role:'DATA_ENTRY',active:true,institution_id:'olot-op',institution_name:'Olot OP',institution_type:'OP',scope:'Olot'},{id:'u2',username:'dpm',role:'DATA_ENTRY',active:true,institution_id:'dpm1',institution_name:'Onkologiya',institution_type:'DPM',scope:'Buxoro shahri'}]});
    if(u.pathname==='/api/v1/admin/users'&&r.method==='POST') return json({ok:true,id:'new',username:body.username},201);
    if(u.pathname.endsWith('/reset')||u.pathname.endsWith('/status')) return json({ok:true});
    return json({error:'not found'},404);
  };
  const audits:any[]=[]; const profiles:any[]=[]; const createdAdmins:any[]=[];
  const deps:AdminApiDeps={getProfile:async()=>profile,listAdminProfiles:async()=>profiles,upsertAdminProfile:async(p)=>{profiles.push(p)},appendAudit:async(e)=>{audits.push(e)},createAdminAccount:async(input)=>{createdAdmins.push(input);return {id:'new-admin',username:input.username}}};
  return {innerFetch,deps,calls,audits,profiles,createdAdmins};
}

describe('super admin API',()=>{
  test('returns 401 when actor/profile cannot be resolved',async()=>{const h=harness(null);const r=await handleAdminApi(req('/api/control/me'),h.innerFetch,h.deps);expect(r?.status).toBe(401)});
  test('ordinary admin can create credential only in own district and not DPM',async()=>{const h=harness(adminP);let r=await handleAdminApi(req('/api/control/credentials','POST',{institutionId:'olot-op',username:'u',password:'12345678'}),h.innerFetch,h.deps);expect(r?.status).toBe(201);expect(h.calls.some(c=>c.path==='/api/v1/admin/users'&&c.method==='POST'&&c.body.role==='DATA_ENTRY')).toBe(true);r=await handleAdminApi(req('/api/control/credentials','POST',{institutionId:'romitan-op',username:'u2',password:'12345678'}),h.innerFetch,h.deps);expect(r?.status).toBe(403);r=await handleAdminApi(req('/api/control/credentials','POST',{institutionId:'dpm1',username:'d',password:'12345678'}),h.innerFetch,h.deps);expect(r?.status).toBe(403)});
  test('province viewer can see DPM user but cannot mutate',async()=>{const h=harness(viewerP);let r=await handleAdminApi(req('/api/control/users'),h.innerFetch,h.deps);expect(r?.status).toBe(200);const d:any=await r?.json();expect(d.users.length).toBe(2);r=await handleAdminApi(req('/api/control/users/u1/reset','POST',{password:'12345678'}),h.innerFetch,h.deps);expect(r?.status).toBe(403)});
  test('only super admin can assign admins and second super admin is rejected',async()=>{let h=harness(adminP);let r=await handleAdminApi(req('/api/control/admins','POST',{username:'x',password:'12345678',role:'ADMIN',scopeType:'district',districtId:'Olot'}),h.innerFetch,h.deps);expect(r?.status).toBe(403);h=harness(superP);r=await handleAdminApi(req('/api/control/admins','POST',{username:'n1',password:'12345678',role:'CONTROL_ADMIN',scopeType:'province',controlMode:'viewer'}),h.innerFetch,h.deps);expect(r?.status).toBe(201);expect(h.createdAdmins.length).toBe(1);expect(h.profiles[0].role).toBe('CONTROL_ADMIN');r=await handleAdminApi(req('/api/control/admins','POST',{username:'n2',password:'12345678',role:'SUPER_ADMIN',scopeType:'province'}),h.innerFetch,h.deps);expect(r?.status).toBe(400)});
});
