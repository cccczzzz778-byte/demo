import postgres from 'postgres';
import { bootstrapExistingAdmin, ensureRbacSchema, type SqlLike } from './rbac-store';
import { createDefaultAdminApiDeps, handleAdminApi, type ResolvedActor } from './super-admin-api';
import { createSecurityGateRequest, isAdminManagedRequest, withSecurityHeaders } from './super-admin-wrapper-core';
import {
  ensureMonitorSchema,
  hashSessionToken,
  isSessionRevoked,
  recordHttpResult,
  touchPresence,
  type MonitorSqlLike,
} from './admin-monitor-store';

const nativeServe=Bun.serve.bind(Bun);
const databaseUrl=Bun.env.DATABASE_URL||'';
const rawDb=databaseUrl?postgres(databaseUrl,{max:4,idle_timeout:20,connect_timeout:15}):null;
const rbacDb=rawDb as unknown as SqlLike|null;
const monitorDb=rawDb as unknown as MonitorSqlLike|null;
const deps=rbacDb?createDefaultAdminApiDeps(rbacDb):null;
let rbacReady=false;
const SESSION_COOKIE='ssb_session';
const unsafeMethods=new Set(['POST','PUT','PATCH','DELETE']);

if(rbacDb) await ensureRbacSchema(rbacDb);
if(monitorDb) await ensureMonitorSchema(monitorDb);

function cookieValue(header:string|null,name:string):string|null{
  if(!header)return null;
  for(const part of header.split(';')){
    const i=part.indexOf('=');
    if(i<0)continue;
    if(part.slice(0,i).trim()===name){
      try{return decodeURIComponent(part.slice(i+1).trim())}catch{return part.slice(i+1).trim()}
    }
  }
  return null;
}

function tokenFromSetCookie(header:string|null):string|null{
  if(!header)return null;
  const match=header.match(/(?:^|,\s*)ssb_session=([^;]+)/i);
  if(!match)return null;
  try{return decodeURIComponent(match[1])}catch{return match[1]}
}

function clientIp(request:Request):string|null{
  const forwarded=(request.headers.get('x-forwarded-for')||'').split(',')[0].trim();
  return forwarded||request.headers.get('cf-connecting-ip')||request.headers.get('x-real-ip')||null;
}

function presenceActor(resolved:ResolvedActor){
  return {
    username:resolved.profile.username,
    role:resolved.profile.role,
    scopeType:resolved.profile.scopeType,
    districtId:resolved.profile.districtId,
    facilityId:resolved.profile.facilityId,
  };
}

async function touchResolvedPresence(request:Request,innerFetch:(request:Request)=>Promise<Response>,sessionToken:string,force=false){
  if(!deps||!monitorDb||!rbacReady||!sessionToken)return;
  try{
    const resolved=await deps.resolveActor(request,innerFetch);
    if(!resolved)return;
    await touchPresence(monitorDb,presenceActor(resolved),{
      sessionToken,
      userAgent:request.headers.get('user-agent'),
      ip:clientIp(request),
    },{force});
  }catch(e){
    console.error('PRESENCE_TOUCH_FAILED',e instanceof Error?e.message:String(e));
  }
}

function unavailable(gate:Response){
  return withSecurityHeaders(new Response(JSON.stringify({error:'RBAC vaqtincha tayyor emas'}),{status:503,headers:{'content-type':'application/json; charset=utf-8'}}),gate);
}

function revokedResponse(gate:Response){
  const headers=new Headers({'content-type':'application/json; charset=utf-8','set-cookie':`${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});
  return withSecurityHeaders(new Response(JSON.stringify({error:'Sessiya bekor qilingan'}),{status:401,headers}),gate);
}

Bun.serve=function superAdminServe(options:any){
  if(!options||typeof options.fetch!=='function')return nativeServe(options);
  const innerFetch=options.fetch;
  return nativeServe({
    ...options,
    fetch:async(request:Request,server:any)=>{
      const started=performance.now();
      const finish=(response:Response)=>{recordHttpResult(response.status,performance.now()-started);return response};
      try{
        const method=request.method.toUpperCase();
        const managed=isAdminManagedRequest(request);
        const unsafe=unsafeMethods.has(method);
        const sessionToken=cookieValue(request.headers.get('cookie'),SESSION_COOKIE);
        let gateResponse:Response|null=null;

        // Mutating requests are security-probed before any revocation/RBAC work,
        // so the existing CSRF/rate/payload checks keep their original priority.
        if(unsafe||managed){
          const gateRequest=await createSecurityGateRequest(request);
          gateResponse=await innerFetch(gateRequest,server);
          if(gateResponse.status!==404)return finish(gateResponse);
        }

        if(sessionToken&&monitorDb){
          const revoked=await isSessionRevoked(monitorDb,hashSessionToken(sessionToken));
          if(revoked){
            if(!gateResponse){
              const gateRequest=await createSecurityGateRequest(new Request(request.url,{method:'GET',headers:request.headers}));
              gateResponse=await innerFetch(gateRequest,server);
            }
            return finish(revokedResponse(gateResponse));
          }
        }

        if(managed){
          if(!gateResponse){
            const gateRequest=await createSecurityGateRequest(request);
            gateResponse=await innerFetch(gateRequest,server);
            if(gateResponse.status!==404)return finish(gateResponse);
          }
          if(!deps||!rbacReady)return finish(unavailable(gateResponse));
          const handled=await handleAdminApi(request,(r:Request)=>innerFetch(r,server),deps);
          if(handled){
            if(sessionToken&&handled.status<500)await touchResolvedPresence(request,(r:Request)=>innerFetch(r,server),sessionToken);
            return finish(withSecurityHeaders(handled,gateResponse));
          }
        }

        const response=await innerFetch(request,server);

        if(response.status===200&&new URL(request.url).pathname==='/api/auth/login'){
          const loginToken=tokenFromSetCookie(response.headers.get('set-cookie'));
          if(loginToken){
            const h=new Headers(request.headers);h.set('cookie',`${SESSION_COOKIE}=${encodeURIComponent(loginToken)}`);
            const authRequest=new Request(request.url,{method:'GET',headers:h});
            await touchResolvedPresence(authRequest,(r:Request)=>innerFetch(r,server),loginToken,true);
          }
        }else if(sessionToken&&response.status<500){
          await touchResolvedPresence(request,(r:Request)=>innerFetch(r,server),sessionToken);
        }

        return finish(response);
      }catch(e){
        recordHttpResult(500,performance.now()-started);
        throw e;
      }
    },
  });
};

await import('./district-ux-wrapper.ts');

if(rbacDb){
  const state=await bootstrapExistingAdmin(rbacDb,'admin');
  rbacReady=state!=='missing';
  console.log('RBAC_BOOTSTRAP',state,rbacReady?'READY':'NOT_READY');
}else{
  console.error('RBAC_BOOTSTRAP DATABASE_URL_MISSING');
}
