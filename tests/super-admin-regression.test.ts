import { describe, expect, test } from 'bun:test';
import { handleAdminApi, type AdminApiDeps } from '../super-admin-api.ts';
import type { AccessProfile } from '../rbac.ts';

const admin:AccessProfile={username:'olot-admin',role:'ADMIN',scopeType:'district',districtId:'Olot',facilityId:null,controlMode:null,active:true};
const root:AccessProfile={username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:null,active:true};
function req(path:string,method='GET',body?:unknown){return new Request('https://x'+path,{method,headers:{cookie:'ssb_session=x','content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})}
function js(data:any,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
function h(profile:AccessProfile){
 const users=[
  {id:'admin2',username:'other-admin',role:'ADMIN',active:true,institution_id:null,institution_name:null,institution_type:null,scope:'Olot'},
  {id:'u1',username:'op-user',role:'DATA_ENTRY',active:true,institution_id:'op1',institution_name:'Olot OP',institution_type:'OP',scope:'Olot'},
 ];
 const inst=[{id:'ttb1',name:'Olot TTB',type:'TTB',scope:'Olot',parent_id:null},{id:'op1',name:'Olot OP',type:'OP',scope:'Olot',parent_id:'ttb1'},{id:'dpm1',name:'Onkologiya',type:'DPM',scope:'Buxoro shahri',parent_id:null}];
 const inner=async(r:Request)=>{const p=new URL(r.url).pathname;if(p==='/api/v1/me')return js({id:'a',username:profile.username,role:'ADMIN',institutionId:null,scope:profile.districtId});if(p==='/api/v1/admin/users'&&r.method==='GET')return js({users});if(p==='/api/v1/institutions')return js({institutions:inst});if(p.endsWith('/reset'))return js({ok:true});return js({ok:true})};
 const deps:AdminApiDeps={getProfile:async()=>profile,listAdminProfiles:async()=>[],upsertAdminProfile:async()=>{},appendAudit:async()=>{},createAdminAccount:async()=>({id:'x',username:'x'}),listPresence:async()=>[],revokeSession:async()=>{},listSecurityEvents:async()=>[],listAudit:async()=>[],getHealth:async()=>({}),updateHierarchy:async()=>{}};
 return {inner,deps};
}

describe('admin security regressions',()=>{
 test('facility user listing excludes legacy ADMIN accounts',async()=>{const x=h(root);const r=await handleAdminApi(req('/api/control/users'),x.inner,x.deps);const d:any=await r!.json();expect(d.users.map((u:any)=>u.role)).toEqual(['DATA_ENTRY'])});
 test('district admin cannot reset another admin account even in same district',async()=>{const x=h(admin);const r=await handleAdminApi(req('/api/control/users/admin2/reset','POST',{password:'abcdefgh'}),x.inner,x.deps);expect(r?.status).toBe(404)});
 test('DPM cannot be attached under a district center even by Super Admin',async()=>{const x=h(root);const r=await handleAdminApi(req('/api/control/hierarchy','POST',{institutionId:'dpm1',parentId:'ttb1'}),x.inner,x.deps);expect(r?.status).toBe(400)});
});
