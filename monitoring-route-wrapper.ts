import { randomBytes } from 'node:crypto';
import { prepareMonitoringDashboardHtml } from './monitoring-template.ts';

const nativeServe = Bun.serve.bind(Bun);
const THREE_ASSET_PATH='/assets/three-r128.min.js';
const THREE_SOURCES=[
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://raw.githubusercontent.com/mrdoob/three.js/r128/build/three.min.js',
];
let threeAssetPromise:Promise<string>|null=null;

async function loadThreeAsset(){
  if(!threeAssetPromise){
    threeAssetPromise=(async()=>{
      let lastError='unknown';
      for(const source of THREE_SOURCES){
        try{
          const response=await fetch(source,{headers:{'user-agent':'Buxoro-SSB-Dashboard/1.0'}});
          if(!response.ok){lastError=`${source} -> ${response.status}`;continue}
          const text=await response.text();
          if(!text.includes('THREE')||text.length<100000){lastError=`${source} -> invalid payload`;continue}
          return text;
        }catch(e){lastError=e instanceof Error?e.message:String(e)}
      }
      throw new Error(`Unable to load Three.js r128: ${lastError}`);
    })().catch(e=>{threeAssetPromise=null;throw e});
  }
  return threeAssetPromise;
}

function monitoringHeaders(source: Headers, nonce: string) {
  const headers = new Headers(source);
  headers.delete('content-length');
  headers.set('content-type','text/html; charset=utf-8');
  headers.set('cache-control','no-store, no-cache, must-revalidate');
  headers.set('pragma','no-cache');
  headers.set('expires','0');
  headers.set('x-content-type-options','nosniff');
  headers.set('referrer-policy','same-origin');
  headers.set('x-frame-options','SAMEORIGIN');
  headers.set('content-security-policy',[
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
  ].join('; '));
  return headers;
}

Bun.serve=function monitoringRouteServe(options:any){
  if(!options||typeof options.fetch!=='function')return nativeServe(options);
  const innerFetch=options.fetch;
  return nativeServe({
    ...options,
    fetch:async(request:Request,server:any)=>{
      try{
        const pathname=new URL(request.url).pathname;
        if(request.method==='GET'&&pathname===THREE_ASSET_PATH){
          try{
            const body=await loadThreeAsset();
            return new Response(body,{status:200,headers:{
              'content-type':'application/javascript; charset=utf-8',
              'cache-control':'public, max-age=31536000, immutable',
              'x-content-type-options':'nosniff',
            }});
          }catch(e){
            console.error('THREE_ASSET_PROXY_FAILED',e instanceof Error?e.message:String(e));
            return new Response('Three.js asset unavailable',{status:503,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
          }
        }
      }catch{}

      const response=await innerFetch(request,server);
      try{
        const pathname=new URL(request.url).pathname;
        const contentType=response?.headers?.get?.('content-type')||'';
        if(request.method==='GET'&&pathname==='/leadership'&&response instanceof Response&&response.status>=200&&response.status<300&&contentType.includes('text/html')){
          const nonce=randomBytes(16).toString('base64');
          const html=prepareMonitoringDashboardHtml(nonce);
          return new Response(html,{status:response.status,statusText:response.statusText,headers:monitoringHeaders(response.headers,nonce)});
        }
      }catch(e){
        console.error('MONITORING_ROUTE_PATCH_FAILED',e instanceof Error?e.message:String(e));
      }
      return response;
    },
  });
};
