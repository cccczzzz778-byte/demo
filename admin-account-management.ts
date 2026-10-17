import { randomUUID } from 'node:crypto';
import { LegacyAdminContract, normalizeLegacyActor } from './legacy-admin-contract.ts';
import type { AccessProfile } from './rbac.ts';

export type AdminAccountManagementDeps={
 getProfile(username:string):Promise<AccessProfile|null>;
 setProfileActive(username:string,active:boolean):Promise<void>;
 appendAudit(event:{id:string;actorUsername:string|null;action:string;target?:string|null;details?:unknown}):Promise<void>;
};
type InnerFetch=(request:Request)=>Promise<Response>;
function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function headers(request:Request){const h=new Headers({'content-type':'application/json'});const c=request.headers.get('cookie');if(c)h.set('cookie',c);return h}
async function forward(inner:InnerFetch,request:Request,path:string,init?:RequestInit){const u=new URL(request.url);u.pathname=path;u.search='';return inner(new Request(u,{method:init?.method||'GET',headers:headers(request),body:init?.body}))}
export async function handleAdminAccountManagement(request:Request,innerFetch:InnerFetch,deps:AdminAccountManagementDeps):Promise<Response|null>{
 const url=new URL(request.url),m=url.pathname.match(/^\/api\/control\/admins\/([^/]+)\/(reset|status)$/);if(!m||request.method!=='POST')return null;
 const me=await forward(innerFetch,request,LegacyAdminContract.me);if(!me.ok)return json({error:'Unauthorized'},401);let payload:any;try{payload=await me.json()}catch{return json({error:'Unauthorized'},401)}const actor=normalizeLegacyActor(payload);if(!actor)return json({error:'Unauthorized'},401);const profile=await deps.getProfile(actor.username);if(!profile||!profile.active||profile.role!=='SUPER_ADMIN')return json({error:'Forbidden'},403);
 const username=decodeURIComponent(m[1]).trim().toLowerCase();if(username==='admin')return json({error:'Yagona Super Admin bu boshqaruv orqali o‘zgartirilmaydi'},400);
 const list=await forward(innerFetch,request,LegacyAdminContract.listUsers);if(!list.ok)return json({error:'Adminlar ro‘yxati olinmadi'},502);let data:any;try{data=await list.json()}catch{return json({error:'Adminlar ro‘yxati olinmadi'},502)}const target=(Array.isArray(data?.users)?data.users:[]).find((u:any)=>String(u.username||'').toLowerCase()===username&&u.role==='ADMIN');if(!target)return json({error:'Admin topilmadi'},404);
 if(m[2]==='reset'){
  let body:any;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}const password=String(body?.password||'');if(password.length<8||password.length>128)return json({error:'Parol 8–128 belgi bo‘lishi kerak'},400);
  const r=await forward(innerFetch,request,LegacyAdminContract.resetUser(target.id),{method:'POST',body:JSON.stringify({password})});if(!r.ok)return new Response(await r.text(),{status:r.status,headers:{'content-type':'application/json; charset=utf-8'}});await deps.appendAudit({id:randomUUID(),actorUsername:actor.username,action:'ADMIN_PASSWORD_RESET',target:username});return json({ok:true});
 }
 let body:any;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}if(typeof body?.active!=='boolean')return json({error:'active boolean bo‘lishi kerak'},400);const r=await forward(innerFetch,request,LegacyAdminContract.setUserActive(target.id),{method:'POST',body:JSON.stringify({active:body.active})});if(!r.ok)return new Response(await r.text(),{status:r.status,headers:{'content-type':'application/json; charset=utf-8'}});await deps.setProfileActive(username,body.active);await deps.appendAudit({id:randomUUID(),actorUsername:actor.username,action:'ADMIN_STATUS',target:username,details:{active:body.active}});return json({ok:true,active:body.active});
}
