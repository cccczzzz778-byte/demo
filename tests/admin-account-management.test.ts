import { describe, expect, test } from 'bun:test';
import { handleAdminAccountManagement, type AdminAccountManagementDeps } from '../admin-account-management.ts';
import type { AccessProfile } from '../rbac.ts';

const root:AccessProfile={username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:null,active:true};
const district:AccessProfile={username:'olot-admin',role:'ADMIN',scopeType:'district',districtId:'Olot',facilityId:null,controlMode:null,active:true};
function req(path:string,body:any){return new Request('https://x'+path,{method:'POST',headers:{cookie:'ssb_session=x','content-type':'application/json'},body:JSON.stringify(body)})}
function js(data:any,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
function harness(actorProfile:AccessProfile){
 const calls:any[]=[],activeChanges:any[]=[],audits:any[]=[];
 const inner=async(r:Request)=>{const p=new URL(r.url).pathname;let body:any={};try{body=await r.clone().json()}catch{}calls.push({path:p,method:r.method,body});if(p==='/api/v1/me')return js({id:'a',username:actorProfile.username,role:'ADMIN',institutionId:null,scope:actorProfile.districtId});if(p==='/api/v1/admin/users'&&r.method==='GET')return js({users:[{id:'root-id',username:'admin',role:'ADMIN',active:true},{id:'n1-id',username:'n1',role:'ADMIN',active:true,scope:'Olot'}]});if(p.endsWith('/reset')||p.endsWith('/status'))return js({ok:true});return js({error:'nf'},404)};
 const deps:AdminAccountManagementDeps={getProfile:async()=>actorProfile,setProfileActive:async(u,a)=>{activeChanges.push([u,a])},appendAudit:async(e)=>{audits.push(e)}};
 return {inner,deps,calls,activeChanges,audits};
}

describe('appointed admin management',()=>{
 test('only Super Admin can reset appointed admin password',async()=>{let h=harness(district);let r=await handleAdminAccountManagement(req('/api/control/admins/n1/reset',{password:'abcdefgh'}),h.inner,h.deps);expect(r?.status).toBe(403);h=harness(root);r=await handleAdminAccountManagement(req('/api/control/admins/n1/reset',{password:'abcdefgh'}),h.inner,h.deps);expect(r?.status).toBe(200);expect(h.calls.some(x=>x.path==='/api/v1/admin/users/n1-id/reset')).toBe(true);expect(h.audits[0].action).toBe('ADMIN_PASSWORD_RESET')});
 test('Super Admin can block appointed admin and access profile is synchronized',async()=>{const h=harness(root);const r=await handleAdminAccountManagement(req('/api/control/admins/n1/status',{active:false}),h.inner,h.deps);expect(r?.status).toBe(200);expect(h.calls.some(x=>x.path==='/api/v1/admin/users/n1-id/status'&&x.body.active===false)).toBe(true);expect(h.activeChanges).toEqual([['n1',false]])});
 test('root Super Admin account cannot be reset or blocked through appointed-admin controls',async()=>{const h=harness(root);expect((await handleAdminAccountManagement(req('/api/control/admins/admin/reset',{password:'abcdefgh'}),h.inner,h.deps))?.status).toBe(400);expect((await handleAdminAccountManagement(req('/api/control/admins/admin/status',{active:false}),h.inner,h.deps))?.status).toBe(400)});
 test('unknown or non-ADMIN target is hidden',async()=>{const h=harness(root);const r=await handleAdminAccountManagement(req('/api/control/admins/nope/reset',{password:'abcdefgh'}),h.inner,h.deps);expect(r?.status).toBe(404)});
});
