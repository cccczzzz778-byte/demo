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

      // IMPORTANT: /leadership must be produced by the existing dashboard wrapper chain.
      // Replacing it with a second embedded template caused the blank-canvas regression.
      return innerFetch(request,server);
    },
  });
};
