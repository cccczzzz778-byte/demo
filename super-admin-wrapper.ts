import { createHash, randomBytes, randomUUID, scryptSync } from 'node:crypto';
import postgres from 'postgres';
import { handleAdminApi, type AdminApiDeps } from './super-admin-api.ts';
import { appendAdminAudit, bootstrapSuperAdmin, ensureRbacSchema, getProfile, listAdminProfiles, upsertAdminProfile } from './rbac-store.ts';
import { createSessionHash, ensureMonitorSchema, getRuntimeMetrics, isSessionRevoked, recordHttpResult, touchPresence } from './admin-monitor-store.ts';
import { LegacyAdminContract, normalizeLegacyActor } from './legacy-admin-contract.ts';

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
};

function isDirectLegacyUserManagement(pathname: string) {
  return /^\/api\/v1\/(?:admin|region)\/users(?:\/|$)/.test(pathname);
}
function sessionToken(request: Request) {
  const cookie=request.headers.get('cookie')||'';
  for(const part of cookie.split(';')) { const [k,...v]=part.trim().split('='); if(k==='ssb_session') return decodeURIComponent(v.join('=')); }
  return '';
}
function ipHash(request: Request) {
  const ip=(request.headers.get('x-forwarded-for')||'').split(',')[0].trim();
  return ip?createHash('sha256').update(ip).digest('hex'):null;
}
async function maybeTouchPresence(request: Request, innerFetch: (request:Request)=>Promise<Response>, hash:string) {
  if(!db || !hash) return;
  const now=Date.now(), last=presenceThrottle.get(hash)||0; if(now-last<60_000) return;
  const url=new URL(request.url); url.pathname=LegacyAdminContract.me; url.search='';
  const h=new Headers(); const cookie=request.headers.get('cookie'); if(cookie)h.set('cookie',cookie);
  const me=await innerFetch(new Request(url,{headers:h})); if(!me.ok)return;
  let payload:unknown; try{payload=await me.json()}catch{return}; const actor=normalizeLegacyActor(payload); if(!actor)return;
  const profile=await getProfile(db as any,actor.username); if(!profile)return;
  await touchPresence(db as any,{username:profile.username,role:profile.role},{sessionHash:hash,ipHash:ipHash(request),userAgent:request.headers.get('user-agent'),district:profile.districtId||actor.scope||null});
  presenceThrottle.set(hash,now);
}

Bun.serve = function superAdminServe(options: any) {
  if (!options || typeof options.fetch !== 'function') return nativeServe(options);
  const innerFetch = options.fetch;
  return nativeServe({
    ...options,
    fetch: async (request: Request, server: any) => {
      const started=performance.now();
      let response: Response;
      try {
        const pathname = new URL(request.url).pathname;
        const token=sessionToken(request); const hash=token?createSessionHash(token):'';
        if(db && hash && await isSessionRevoked(db as any,hash)) {
          response=new Response(JSON.stringify({error:'Session revoked'}),{status:401,headers:{'content-type':'application/json; charset=utf-8','set-cookie':'ssb_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0','cache-control':'no-store'}});
        } else if (pathname.startsWith('/api/control/')) {
          if (!db) response=new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers: { 'content-type': 'application/json' } });
          else response=(await handleAdminApi(request, innerFetch, deps)) || new Response(JSON.stringify({error:'Not found'}),{status:404});
        } else if (isDirectLegacyUserManagement(pathname)) {
          response=new Response(JSON.stringify({ error: 'Use scoped control API' }), { status: 403, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
        } else {
          response=await innerFetch(request, server);
        }
        if(hash && response.status<500) void maybeTouchPresence(request,innerFetch,hash).catch(()=>{});
      } catch(e) {
        console.error('SUPER_ADMIN_WRAPPER_ERROR',e instanceof Error?e.message:String(e));
        response=new Response(JSON.stringify({error:'Internal server error'}),{status:500,headers:{'content-type':'application/json'}});
      }
      recordHttpResult(response.status,performance.now()-started);
      return response;
    },
  });
};

export { getRuntimeMetrics };
await import('./district-ux-wrapper.ts');
