import postgres from 'postgres';
import { bootstrapExistingAdmin, ensureRbacSchema, type SqlLike } from './rbac-store';
import { createDefaultAdminApiDeps, handleAdminApi } from './super-admin-api';
import { createSecurityGateRequest, isAdminManagedRequest, withSecurityHeaders } from './super-admin-wrapper-core';

const nativeServe=Bun.serve.bind(Bun);
const databaseUrl=Bun.env.DATABASE_URL||'';
const rawDb=databaseUrl?postgres(databaseUrl,{max:4,idle_timeout:20,connect_timeout:15}):null;
const rbacDb=rawDb as unknown as SqlLike|null;
const deps=rbacDb?createDefaultAdminApiDeps(rbacDb):null;
let rbacReady=false;

if(rbacDb) await ensureRbacSchema(rbacDb);

function unavailable(gate:Response){
  return withSecurityHeaders(new Response(JSON.stringify({error:'RBAC vaqtincha tayyor emas'}),{status:503,headers:{'content-type':'application/json; charset=utf-8'}}),gate);
}

Bun.serve=function superAdminServe(options:any){
  if(!options||typeof options.fetch!=='function')return nativeServe(options);
  const innerFetch=options.fetch;
  return nativeServe({
    ...options,
    fetch:async(request:Request,server:any)=>{
      if(!isAdminManagedRequest(request))return innerFetch(request,server);

      // Reuse the existing inner security wrapper (origin checks, rate limits,
      // payload limits and hardened response headers) without executing the
      // real credential/admin mutation as the probe.
      const gateRequest=await createSecurityGateRequest(request);
      const gateResponse=await innerFetch(gateRequest,server);
      if(gateResponse.status!==404)return gateResponse;
      if(!deps||!rbacReady)return unavailable(gateResponse);

      const handled=await handleAdminApi(request,(r:Request)=>innerFetch(r,server),deps);
      if(handled)return withSecurityHeaders(handled,gateResponse);
      return innerFetch(request,server);
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
