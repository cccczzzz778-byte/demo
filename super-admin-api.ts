import { randomUUID } from 'node:crypto';
import { LegacyAdminContract, normalizeLegacyActor } from './legacy-admin-contract.ts';
import { authorize, type AccessProfile, type ResourceScope } from './rbac.ts';

export type AdminApiDeps = {
  getProfile(username: string): Promise<AccessProfile | null>;
  listAdminProfiles(): Promise<AccessProfile[]>;
  upsertAdminProfile(profile: AccessProfile): Promise<void>;
  appendAudit(event: { id: string; actorUsername: string | null; action: string; target?: string | null; details?: unknown }): Promise<void>;
  createAdminAccount(input: { username: string; password: string; scope: string | null }): Promise<{ id: string; username: string }>;
};

type InnerFetch = (request: Request) => Promise<Response>;
type LegacyInstitution = { id:string; name:string; type:string; scope:string|null; parent_id?:string|null };
type LegacyUser = { id:string; username:string; role:string; active:boolean; institution_id?:string|null; institution_name?:string|null; institution_type?:string|null; scope?:string|null };

function j(data: unknown, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
}
function cloneHeaders(request: Request) {
  const h = new Headers(); const cookie = request.headers.get('cookie'); if (cookie) h.set('cookie', cookie); h.set('content-type','application/json'); return h;
}
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
function scopeOfInstitution(i: LegacyInstitution): ResourceScope { return { district:i.scope ?? null, facilityId:i.id, isDpm:i.type === 'DPM' }; }
function scopeOfUser(u: LegacyUser): ResourceScope { return { district:u.scope ?? null, facilityId:u.institution_id ?? null, isDpm:u.institution_type === 'DPM' }; }
function expectedLegacyRole(type:string) { if (type === 'TTB' || type === 'SHTB') return 'TTB_SHTB'; if (type === 'SSB') return 'LEADERSHIP'; if (type === 'DPM' || type === 'OP' || type === 'OSHP') return 'DATA_ENTRY'; return null; }
function visible(profile: AccessProfile, scope: ResourceScope) { return authorize(profile,'VIEW',scope).allowed; }
async function institutions(request: Request, innerFetch: InnerFetch): Promise<LegacyInstitution[]> { const r = await innerJson(innerFetch, request, '/api/v1/institutions'); if (!r.response.ok) return []; return Array.isArray(r.data?.institutions) ? r.data.institutions : []; }
async function users(request: Request, innerFetch: InnerFetch): Promise<LegacyUser[]> { const r = await innerJson(innerFetch, request, LegacyAdminContract.listUsers); if (!r.response.ok) return []; return Array.isArray(r.data?.users) ? r.data.users : []; }
function adminProfileFromBody(body:any): AccessProfile | null {
  const role = String(body?.role || ''); if (role !== 'ADMIN' && role !== 'CONTROL_ADMIN') return null;
  const scopeType = String(body?.scopeType || '') as AccessProfile['scopeType'];
  const controlMode = role === 'CONTROL_ADMIN' ? String(body?.controlMode || '') as AccessProfile['controlMode'] : null;
  return { username:String(body?.username || '').trim().toLowerCase(), role, scopeType, districtId: body?.districtId ? String(body.districtId) : null, facilityId:null, controlMode, active:true };
}

export async function handleAdminApi(request: Request, innerFetch: InnerFetch, deps: AdminApiDeps): Promise<Response | null> {
  const url = new URL(request.url); if (!url.pathname.startsWith('/api/control/')) return null;
  const ctx = await resolveContext(request, innerFetch, deps); if ('error' in ctx) return ctx.error;
  const { actor, profile } = ctx; const method = request.method.toUpperCase();
  if (url.pathname === '/api/control/me' && method === 'GET') return j({actor,profile});
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
      return j({ok:true,id:created.id,username:created.username,profile:p},201);
    } catch (e) { const msg = e instanceof Error ? e.message : String(e); return j({error:/unique|duplicate/i.test(msg)?'Bu login band':'Admin yaratilmadi'},409); }
  }
  if (url.pathname === '/api/control/institutions' && method === 'GET') return j({institutions:(await institutions(request,innerFetch)).filter(i=>visible(profile,scopeOfInstitution(i)))});
  if (url.pathname === '/api/control/users' && method === 'GET') return j({users:(await users(request,innerFetch)).filter(u=>visible(profile,scopeOfUser(u)))});
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
    const target = (await users(request,innerFetch)).find(u=>u.id===decodeURIComponent(m[1])); if (!target) return j({error:'Foydalanuvchi topilmadi'},404);
    const action = m[2] === 'reset' ? 'RESET_CREDENTIAL' : 'SET_ACTIVE'; const decision = authorize(profile,action,scopeOfUser(target)); if (!decision.allowed) return j({error:'Forbidden',reason:decision.reason},403);
    const bodyText = await request.text(); const path = m[2] === 'reset' ? LegacyAdminContract.resetUser(target.id) : LegacyAdminContract.setUserActive(target.id);
    const forwarded = await innerJson(innerFetch,request,path,{method:'POST',body:bodyText});
    if (forwarded.response.ok) await deps.appendAudit({id:randomUUID(),actorUsername:actor.username,action:m[2]==='reset'?'CREDENTIAL_RESET':'USER_STATUS',target:target.id});
    return new Response(await forwarded.response.text(),{status:forwarded.response.status,headers:{'content-type':'application/json; charset=utf-8'}});
  }
  return j({error:'Not found'},404);
}
