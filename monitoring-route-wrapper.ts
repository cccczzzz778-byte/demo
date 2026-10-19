const nativeServe = Bun.serve.bind(Bun);
const THREE_ASSET_PATH='/assets/three-r128.min.js';
const THREE_FILE='node_modules/three/build/three.min.js';

Bun.serve=function monitoringRouteServe(options:any){
  if(!options||typeof options.fetch!=='function')return nativeServe(options);
  const innerFetch=options.fetch;
  return nativeServe({
    ...options,
    fetch:async(request:Request,server:any)=>{
      try{
        const pathname=new URL(request.url).pathname;
        if(request.method==='GET'&&pathname===THREE_ASSET_PATH){
          const file=Bun.file(THREE_FILE);
          if(await file.exists()){
            return new Response(file,{status:200,headers:{
              'content-type':'application/javascript; charset=utf-8',
              'cache-control':'public, max-age=31536000, immutable',
              'x-content-type-options':'nosniff',
            }});
          }
          console.error('THREE_ASSET_MISSING',THREE_FILE);
          return new Response('Three.js asset unavailable',{status:503,headers:{
            'content-type':'text/plain; charset=utf-8',
            'cache-control':'no-store',
          }});
        }
      }catch(e){
        console.error('MONITORING_ASSET_ROUTE_FAILED',e instanceof Error?e.message:String(e));
      }

      // /leadership is intentionally produced by the established dashboard wrapper chain.
      // Replacing that response with a second embedded template causes the 3D canvas to stay blank.
      // TV and presentation modes are injected by leadership-view-modes-patch in that chain.
      return innerFetch(request,server);
    },
  });
};
