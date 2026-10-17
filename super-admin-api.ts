import { randomUUID } from 'node:crypto';
import { LegacyAdminContract, normalizeLegacyActor } from './legacy-admin-contract.ts';
import { authorize, type AccessProfile, type ResourceScope } from './rbac.ts';
import { buildHierarchy, scopeInstitutions, type LegacyInstitutionRow } from './institution-adapter.ts';

export type AdminApiDeps = {
  getProfile(username: string): Promise<AccessProfile | null>;
  listAdminProfiles(): Promise<AccessProfile[]>;
  upsertAdminProfile(profile: AccessProfile): Promise<void>;
  appendAudit(event: { id: string; actorUsername: string | null; action: string; target?: string | null; details?: unknown }): Promise<void>;
  createAdminAccount(input: { username: string; password: string; scope: string | null }): Promise<{ id: string; username: string }>;
  listPresence(profile: AccessProfile): Promise<any[]>;
  revokeSession(sessionHash: string, profile: AccessProfile): Promise<void>;
  listSecurityEvents(profile: AccessProfile): Promise<any[]>;
  listAudit(profile: AccessProfile): Promise<any[]>;
  getHealth(): Promise<Record<string, unknown>>;
  updateHierarchy(input:{institutionId:string;parentId:string|null},profile:AccessProfile):Promise<void>;
};

type InnerFetch = (request: Request) => Promise<Response>;
type LegacyInstitution = LegacyInstitutionRow;
type LegacyUser = { id:string; username:string; role:string; active:boolean; institution_id?:string|null; institution_name?:string|null; institution_type?:string|null; scope?:string|null };

function j(data: unknown, status=200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } }); }
function cloneHeaders(request: Request) { const h = new Headers(); const cookie = request.headers.get('cookie'); if (cookie) h.set('cookie', cookie); h.set('content-type','application/json'); return h; }
async function innerJson(innerFetch: InnerFetch, request: Request, path: string, init?: RequestInit) {
  const url = new URL(request.url); url.pathname = path; url.search='';
  const response = await innerFetch(new Request(url, { method:init?.method || 'GET', headers:cloneHeaders(request), body:init?.body }));
  let data:any={}; try { data = await response.clone().json(); } catch {}
  return { response, data };
}
async function resolveContext(request: Request, innerFetch: InnerFetch, deps: AdminApiDeps) {
  const me = await innerJson(innerFetch, request, LegacyAdminContract.me);
  if (!me.response.ok) return { error:j({error:'Unauthorized'},401) } as const;
  const actor = normalizeLegacyActor(me.data); if (!actor) return { error:j({error:'Unauthorized'},401) } as const;
  const profile = await deps.getProfile(actor.username); if (!profile || !profile.active) return { error:j({error:'Forbidden'},403) } as const;
  return { actor, profile } as const;
}
function scopeOfInstitution(i: LegacyInstitution): ResourceScope { return { district:i.type==='DPM'?null:(i.scope ?? null), facilityId:i.id, isDpm:i.type === 'DPM' }; }
function scopeOfUser(u: LegacyUser): ResourceScope { return { district:u.institution_type==='DPM'?null:(u.scope ?? null), facilityId:u.institution_id ?? null, isDpm:u.institution_type === 'DPM' }; }
function expectedLegacyRole(type:string) { if (type === 'TTB' || type === 'SHTB') return 'TTB_SHTB'; if (type === 'SSB') return 'LEADERSHIP'; if (type === 'DPM' || type === 'OP' || type === 'OSHP') return 'DATA_ENTRY'; return null; }
function visible(profile: AccessProfile, scope: ResourceScope) { return authorize(profile,'VIEW',scope).allowed; }
async function institutions(request: Request, innerFetch: InnerFetch): Promise<LegacyInstitution[]> { const r = await innerJson(innerFetch, request, '/api/v1/institutions'); if (!r.response.ok) return []; return Array.isArray(r.data?.institutions) ? r.data.institutions : []; }
async function users(request: Request, innerFetch: InnerFetch): Promise<LegacyUser[]> { const r = await innerJson(innerFetch, request, LegacyAdminContract.listUsers); if (!r.response.ok) return []; return Array.isArray(r.data?.users) ? r.data.users : []; }
function facilityUsers(all: LegacyUser[]) { return all.filter(u=>u.role !== 'ADMIN'); }
function adminProfileFromBody(body:any): AccessProfile | null {
  const role = String(body?.role || ''); if (role !== 'ADMIN' && role !== 'CONTROL_ADMIN') return null;
  const scopeType = String(body?.scopeType || '') as AccessProfile['scopeType'];
  const controlMode = role === 'CONTROL_ADMIN' ? String(body?.controlMode || '') as AccessProfile['controlMode'] : null;
  return { username:String(body?.username || '').trim().toLowerCase(), role, scopeType, districtId: body?.districtId ? String(body.districtId) : null, facilityId:null, controlMode, active:true };
}
function safeProfileSettings(profile:AccessProfile){return {role:profile.role,scopeType:profile.scopeType,districtId:profile.districtId,controlMode:profile.controlMode,active:profile.active};}

export async function handleAdminApi(request: Request, innerFetch: InnerFetch, deps: AdminApiDeps): Promise<Response | null> {
  const url = new URL(request.url); if (!url.pathname.startsWith('/api/control/')) return null;
  const ctx = await resolveContext(request, innerFetch, deps); if ('error' in ctx) return ctx.error;
  const { actor, profile } = ctx; const method = request.method.toUpperCase();
  if (url.pathname === '/api/control/me' && method === 'GET') return j({actor,profile:safeProfileSettings(profile)});

  if (url.pathname === '/api/control/summary' && method === 'GET') {
    const scoped=scopeInstitutions(await institutions(request,innerFetch),profile); const us=facilityUsers(await users(request,innerFetch)).filter(u=>visible(profile,scopeOfUser(u)));
    const counts:Record<string,number>={};for(const i of scoped)counts[i.type]=(counts[i.type]||0)+1;
    return j({institutions:scoped.length,users:us.length,activeUsers:us.filter(x=>x.active).length,dpms:scoped.filter(x=>x.type==='DPM').length,counts});
  }
  if (url.pathname === '/api/control/admins' && method === 'GET') {
    if (!authorize(profile,'ASSIGN_ADMIN',{district:null,facilityId:null,isDpm:false}).allowed) return j({error:'Forbidden'},403);
    return j({admins:await deps.listAdminProfiles()});
  }
  if (url.pathname === '/api/control/admins' && method === 'POST') {
    if (!authorize(profile,'ASSIGN_ADMIN',{district:null,facilityId:null,isDpm:false}).allowed) return j({error:'Forbidden'},403);
    let body:any={}; try { body=await request.json(); } catch { return j({error:'Invalid JSON'},400); }
    if (body?.role === 'SUPER_ADMIN') return j({error:'Faqat bitta Super Admin mavjud bo‘ladi'},400);
    const p = adminProfileFromBody(body); const password = String(body?.password || '');
    if (!p?.username || password.length < 8) return j({error:'Login va kamida 8 belgili parol kerak'},400);
    if (p.role === 'ADMIN' && (p.scopeType !== 'district' || !p.districtId)) return j({error:'Oddiy Admin faqat bitta hududga biriktiriladi'},400);
    if (p.role === 'CONTROL_ADMIN' && !['province','district'].includes(p.scopeType)) return j({error:'Nazorat Admin scope noto‘g‘ri'},400);
    if (p.role === 'CONTROL_ADMIN' && p.scopeType === 'district' && !p.districtId) return j({error:'Hudud tanlanishi kerak'},400);
    if (p.role === 'CONTROL_ADMIN' && !['active','viewer'].includes(String(p.controlMode))) return j({error:'Nazorat rejimi noto‘g‘ri'},400);
    try {
      const created = await deps.createAdminAccount({username:p.username,password,scope:p.scopeType==='district'?p.districtId:null});
      await deps.upsertAdminProfile(p);
      await deps.appendAudit({id:randomUUID(),actorUsername:actor.username,action:'ADMIN_CREATE',target:p.username,details:{role:p.role,scopeType:p.scopeType,districtId:p.districtId,controlMode:p.controlMode}});
      return j({ok:true,id:created.id,username:created.username,profile:safeProfileSettings(p)},201);
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); return j({error:/unique|duplicate/i.test(msg)?'Bu login band':'Admin yaratilmadi'},409); }
  }

  if (url.pathname === '/api/control/institutions' && method === 'GET') {
    const scoped=scopeInstitutions(await institutions(request,innerFetch),profile); const q=(url.searchParams.get('q')||'').trim().toLowerCase();
    const filtered=q?scoped.filter(x=>(x.name+' '+x.type+' '+(x.scope||'')).toLowerCase().includes(q)):scoped; return j({institutions:filtered});
  }
  if (url.pathname === '/api/control/hierarchy' && method === 'GET') return j({hierarchy:buildHierarchy(await institutions(request,innerFetch),profile)});
  if (url.pathname === '/api/control/users' && method === 'GET') {
    const scoped=facilityUsers(await users(request,innerFetch)).filter(u=>visible(profile,scopeOfUser(u))); const q=(url.searchParams.get('q')||'').trim().toLowerCase();
    return j({users:q?scoped.filter(x=>(x.username+' '+(x.institution_name||'')+' '+(x.scope||'')).toLowerCase().includes(q)):scoped});
  }

  if (url.pathname === '/api/control/sessions' && method === 'GET') return j({sessions:await deps.listPresence(profile)});
  const sessionMatch=url.pathname.match(/^\/api\/control\/sessions\/([a-f0-9]{64})\/revoke$/);
  if(sessionMatch&&method==='POST'){
    if(profile.role!=='SUPER_ADMIN')return j({error:'Forbidden'},403);
    await deps.revokeSession(sessionMatch[1],profile);return j({ok:true});
  }
  if(url.pathname==='/api/control/security-events'&&method==='GET')return j({events:await deps.listSecurityEvents(profile)});
  if(url.pathname==='/api/control/audit'&&method==='GET')return j({events:await deps.listAudit(profile)});
  if(url.pathname==='/api/control/health'&&method==='GET')return j(await deps.getHealth());
  if(url.pathname==='/api/control/settings'&&method==='GET')return j({profile:safeProfileSettings(profile),dashboardConstructor:false,oneSuperAdmin:true});

  if (url.pathname === '/api/control/hierarchy' && method === 'POST') {
    let body:any={};try{body=await request.json()}catch{return j({error:'Invalid JSON'},400)}
    const all=await institutions(request,innerFetch);const target=all.find(x=>x.id===String(body?.institutionId||''));if(!target)return j({error:'Muassasa topilmadi'},404);
    const parentId=body?.parentId==null?null:String(body.parentId);const parent=parentId?all.find(x=>x.id===parentId):null;if(parentId&&!parent)return j({error:'Parent topilmadi'},404);
    if(target.type==='DPM') {
      if(profile.role!=='SUPER_ADMIN')return j({error:'Forbidden'},403);
      if(parentId!==null)return j({error:'DPM viloyat darajasida qoladi'},400);
    } else {
      if(parent?.type==='DPM')return j({error:'DPM parent bo‘la olmaydi'},400);
      if(parent && parent.type!=='TTB' && parent.type!=='SHTB')return j({error:'Parent TTB yoki SHTB bo‘lishi kerak'},400);
      const t=authorize(profile,'MANAGE_HIERARCHY',scopeOfInstitution(target));if(!t.allowed)return j({error:'Forbidden',reason:t.reason},403);
      if(parent&&!authorize(profile,'MANAGE_HIERARCHY',scopeOfInstitution(parent)).allowed)return j({error:'Forbidden'},403);
      if(parent&&parent.scope!==target.scope)return j({error:'Hududlar mos emas'},400);
    }
    await deps.updateHierarchy({institutionId:target.id,parentId},profile);await deps.appendAudit({id:randomUUID(),actorUsername:actor.username,action:'HIERARCHY_UPDATE',target:target.id,details:{parentId}});return j({ok:true});
  }

  if (url.pathname === '/api/control/credentials' && method === 'POST') {
    let body:any={}; try { body=await request.json(); } catch { return j({error:'Invalid JSON'},400); }
    const inst = (await institutions(request,innerFetch)).find(i=>i.id===String(body?.institutionId||'')); if (!inst) return j({error:'Muassasa topilmadi'},404);
    const decision = authorize(profile,'CREATE_CREDENTIAL',scopeOfInstitution(inst)); if (!decision.allowed) return j({error:'Forbidden',reason:decision.reason},403);
    const role = expectedLegacyRole(inst.type); if (!role) return j({error:'Bu muassasaga credential berilmaydi'},400);
    const forwarded = await innerJson(innerFetch,request,LegacyAdminContract.createUser,{method:'POST',body:JSON.stringify({institutionId:inst.id,role,username:String(body?.username||''),password:String(body?.password||'')})});
    if (forwarded.response.ok) await deps.appendAudit({id:randomUUID(),actorUsername:actor.username,action:'CREDENTIAL_CREATE',target:inst.id,details:{username:String(body?.username||''),institutionId:inst.id}});
    return new Response(await forwarded.response.text(),{status:forwarded.response.status,headers:{'content-type':'application/json; charset=utf-8'}});
  }
  const m = url.pathname.match(/^\/api\/control\/users\/([^/]+)\/(reset|status)$/);
  if (m && method === 'POST') {
    const allUsers=await users(request,innerFetch);
    const target = allUsers.find(u=>u.id===decodeURIComponent(m[1])); if (!target) return j({error:'Foydalanuvchi topilmadi'},404);
    if(target.role==='ADMIN' && profile.role!=='SUPER_ADMIN') return j({error:'Foydalanuvchi topilmadi'},404);
    const action = m[2] === 'reset' ? 'RESET_CREDENTIAL' : 'SET_ACTIVE'; const decision = authorize(profile,action,scopeOfUser(target)); if (!decision.allowed) return j({error:'Forbidden',reason:decision.reason},403);
    const bodyText = await request.text(); const path = m[2] === 'reset' ? LegacyAdminContract.resetUser(target.id) : LegacyAdminContract.setUserActive(target.id);
    const forwarded = await innerJson(innerFetch,request,path,{method:'POST',body:bodyText});
    if (forwarded.response.ok) await deps.appendAudit({id:randomUUID(),actorUsername:actor.username,action:m[2]==='reset'?'CREDENTIAL_RESET':'USER_STATUS',target:target.id});
    return new Response(await forwarded.response.text(),{status:forwarded.response.status,headers:{'content-type':'application/json; charset=utf-8'}});
  }
  return j({error:'Not found'},404);
}
