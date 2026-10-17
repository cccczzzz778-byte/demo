import { createHash, randomBytes, randomUUID, scryptSync } from 'node:crypto';
import postgres from 'postgres';
import { handleAdminApi, type AdminApiDeps } from './super-admin-api.ts';
import { appendAdminAudit, bootstrapSuperAdmin, ensureRbacSchema, getProfile, listAdminProfiles, setProfileActive, upsertAdminProfile } from './rbac-store.ts';
import { createSessionHash, ensureMonitorSchema, getRuntimeMetrics, isSessionRevoked, listPresence, recordHttpResult, revokeSession, touchPresence } from './admin-monitor-store.ts';
import { LegacyAdminContract, normalizeLegacyActor } from './legacy-admin-contract.ts';
import { renderAdminShell } from './super-admin-ui.ts';
import { enhanceAdminShell } from './super-admin-ui-actions.ts';
import { patchSuperAdminModernUi } from './super-admin-modern-patch.ts';
import { patchScoped3dCard } from './district-facility-3d-card-patch.ts';
import { handleAdminAccountManagement } from './admin-account-management.ts';

const nativeServe = Bun.serve.bind(Bun);
const databaseUrl = Bun.env.DATABASE_URL || '';
const db = databaseUrl ? postgres(databaseUrl, { max: 4, idle_timeout: 20, connect_timeout: 15 }) : null;
const presenceThrottle = new Map<string, number>();

function legacyPasswordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `s1$${salt}$${hash}`;
}

if (db) {
  await ensureRbacSchema(db as any);
  await ensureMonitorSchema(db as any);
  await bootstrapSuperAdmin(db as any, 'admin');
}

function provinceWide(profile:any){return profile.role==='SUPER_ADMIN'||(profile.role==='CONTROL_ADMIN'&&profile.scopeType==='province');}
const deps: AdminApiDeps = {
  getProfile: async (username) => db ? getProfile(db as any, username) : null,
  listAdminProfiles: async () => db ? listAdminProfiles(db as any) : [],
  upsertAdminProfile: async (profile) => { if (!db) throw new Error('DATABASE_UNAVAILABLE'); await upsertAdminProfile(db as any, profile); },
  appendAudit: async (event) => { if (db) await appendAdminAudit(db as any, event); },
  createAdminAccount: async ({ username, password, scope }) => {
    if (!db) throw new Error('DATABASE_UNAVAILABLE');
    if (password.length < 8 || password.length > 128) throw new Error('INVALID_PASSWORD');
    const normalized = username.trim().toLowerCase(); if (!normalized) throw new Error('INVALID_USERNAME');
    const id = randomUUID();
    await db`INSERT INTO app_users(id,username,password_hash,role,institution_id,scope,active) VALUES(${id},${normalized},${legacyPasswordHash(password)},'ADMIN',NULL,${scope},true)`;
    return { id, username: normalized };
  },
  listPresence: async (profile) => {
    if(!db)return [];
    return listPresence(db as any, profile.role==='SUPER_ADMIN'||profile.scopeType==='province'?{scopeType:'province'}:{scopeType:'district',districtId:profile.districtId});
  },
  revokeSession: async (sessionHash,profile) => {if(!db)throw new Error('DATABASE_UNAVAILABLE');await revokeSession(db as any,sessionHash,profile);},
  listSecurityEvents: async (profile) => {
    if(!db||!provinceWide(profile))return [];
    return db`SELECT id,created_at,method,path,action,detail FROM app_security_events ORDER BY created_at DESC LIMIT 200`;
  },
  listAudit: async (profile) => {
    if(!db)return [];
    if(provinceWide(profile))return db`SELECT id,actor_username,action,target,details,created_at FROM app_admin_audit ORDER BY created_at DESC LIMIT 300`;
    return db`SELECT a.id,a.actor_username,a.action,a.target,a.details,a.created_at FROM app_admin_audit a LEFT JOIN app_access_profiles p ON lower(p.username)=lower(a.actor_username) WHERE p.district_id=${profile.districtId} ORDER BY a.created_at DESC LIMIT 300`;
  },
  getHealth: async () => {
    let dbOk=false;if(db){try{await db`SELECT 1`;dbOk=true}catch{}}
    return {app:true,db:dbOk,deploymentId:Bun.env.RAILWAY_DEPLOYMENT_ID||null,...getRuntimeMetrics()};
  },
  updateHierarchy: async ({institutionId,parentId}) => {
    if(!db)throw new Error('DATABASE_UNAVAILABLE');
    await db`UPDATE app_institutions SET parent_id=${parentId},updated_at=now() WHERE id=${institutionId}`;
  },
};
const adminMgmtDeps={
  getProfile:deps.getProfile,
  setProfileActive:async(username:string,active:boolean)=>{if(!db)throw new Error('DATABASE_UNAVAILABLE');await setProfileActive(db as any,username,active)},
  appendAudit:deps.appendAudit,
};

function isDirectLegacyUserManagement(pathname: string) { return /^\/api\/v1\/(?:admin|region)\/users(?:\/|$)/.test(pathname); }
function sessionToken(request: Request) {
  const cookie=request.headers.get('cookie')||'';
  for(const part of cookie.split(';')) { const [k,...v]=part.trim().split('='); if(k==='ssb_session') return decodeURIComponent(v.join('=')); }
  return '';
}
function ipHash(request: Request) {
  const ip=(request.headers.get('x-forwarded-for')||'').split(',')[0].trim();
  return ip?createHash('sha256').update(ip).digest('hex'):null;
}
function requestWithSession(request:Request,path:string){
  const url=new URL(request.url);url.pathname=path;url.search='';const h=new Headers();const cookie=request.headers.get('cookie');if(cookie)h.set('cookie',cookie);return new Request(url,{headers:h});
}
async function resolveProfileForRequest(request:Request,innerFetch:(request:Request)=>Promise<Response>){
  if(!db)return null;const me=await innerFetch(requestWithSession(request,LegacyAdminContract.me));if(!me.ok)return null;let data:unknown;try{data=await me.json()}catch{return null};const actor=normalizeLegacyActor(data);if(!actor)return null;return getProfile(db as any,actor.username);
}
async function maybeTouchPresence(request: Request, innerFetch: (request:Request)=>Promise<Response>, hash:string) {
  if(!db || !hash) return;
  const now=Date.now(), last=presenceThrottle.get(hash)||0; if(now-last<60_000) return;
  const me=await innerFetch(requestWithSession(request,LegacyAdminContract.me)); if(!me.ok)return;
  let payload:unknown; try{payload=await me.json()}catch{return}; const actor=normalizeLegacyActor(payload); if(!actor)return;
  const profile=await getProfile(db as any,actor.username);
  await touchPresence(db as any,{username:profile?.username||actor.username,role:profile?.role||actor.role},{sessionHash:hash,ipHash:ipHash(request),userAgent:request.headers.get('user-agent'),district:profile?.districtId||actor.scope||null});
  presenceThrottle.set(hash,now);
}
function cspNonce(headers:Headers,body:string){
  const csp=headers.get('content-security-policy')||'';return csp.match(/'nonce-([^']+)'/)?.[1]||body.match(/nonce=["']([^"']+)["']/)?.[1]||'';
}
async function maybeReplaceAdminPage(request:Request,response:Response,innerFetch:(request:Request)=>Promise<Response>){
  if(new URL(request.url).pathname!=='/admin'||response.status!==200||(response.headers.get('content-type')||'').indexOf('text/html')<0)return response;
  const profile=await resolveProfileForRequest(request,innerFetch);if(!profile||!['SUPER_ADMIN','ADMIN','CONTROL_ADMIN'].includes(profile.role))return response;
  const original=await response.text();const nonce=cspNonce(response.headers,original);if(!nonce)return new Response('Security nonce unavailable',{status:500});
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');
  const shell=patchSuperAdminModernUi(enhanceAdminShell(renderAdminShell(profile),profile));
  return new Response(shell.replaceAll('__CSP_NONCE__',nonce),{status:response.status,statusText:response.statusText,headers});
}
async function maybePatchScoped3dCard(request:Request,response:Response){
  const pathname=new URL(request.url).pathname;
  if(request.method!=='GET'||response.status!==200||(response.headers.get('content-type')||'').indexOf('text/html')<0)return response;
  if(['/admin','/leadership','/map'].includes(pathname))return response;
  const original=await response.text();const patched=patchScoped3dCard(original,pathname);
  if(patched===original)return new Response(original,{status:response.status,statusText:response.statusText,headers:response.headers});
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-store');
  return new Response(patched,{status:response.status,statusText:response.statusText,headers});
}

Bun.serve = function superAdminServe(options: any) {
  if (!options || typeof options.fetch !== 'function') return nativeServe(options);
  const innerFetch = options.fetch;
  return nativeServe({
    ...options,
    fetch: async (request: Request, server: any) => {
      const started=performance.now(); let response: Response;
      try {
        const pathname = new URL(request.url).pathname; const token=sessionToken(request); const hash=token?createSessionHash(token):'';
        if(db && hash && await isSessionRevoked(db as any,hash)) {
          response=new Response(JSON.stringify({error:'Session revoked'}),{status:401,headers:{'content-type':'application/json; charset=utf-8','set-cookie':'ssb_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0','cache-control':'no-store'}});
        } else if (pathname.startsWith('/api/control/')) {
          if (!db) response=new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers: { 'content-type':'application/json' } });
          else response=(await handleAdminAccountManagement(request,innerFetch,adminMgmtDeps)) || (await handleAdminApi(request, innerFetch, deps)) || new Response(JSON.stringify({error:'Not found'}),{status:404});
        } else if (isDirectLegacyUserManagement(pathname)) {
          response=new Response(JSON.stringify({ error: 'Use scoped control API' }), { status: 403, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
        } else {
          response=await innerFetch(request, server);
          response=await maybeReplaceAdminPage(request,response,innerFetch);
          response=await maybePatchScoped3dCard(request,response);
        }
        if(hash && response.status<500) void maybeTouchPresence(request,innerFetch,hash).catch(()=>{});
      } catch(e) {
        console.error('SUPER_ADMIN_WRAPPER_ERROR',e instanceof Error?e.message:String(e));
        response=new Response(JSON.stringify({error:'Internal server error'}),{status:500,headers:{'content-type':'application/json'}});
      }
      recordHttpResult(response.status,performance.now()-started); return response;
    },
  });
};

export { getRuntimeMetrics };
await import('./district-ux-wrapper.ts');
