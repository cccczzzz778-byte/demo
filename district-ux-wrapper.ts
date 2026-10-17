import { patchMapPrerequisites } from './map-prerequisites-patch.ts';
import { patchInstitutionScope } from './institution-scope-patch.ts';
import { patchDistrictDrilldown3d } from './district-drilldown-patch.ts';
import { patchProvinceMarkerHardening } from './province-marker-hardening-patch.ts';
import { LEADERSHIP_V2_HTML, LEADERSHIP_V2_CSS, LEADERSHIP_V2_JS } from './leadership-v2-assets.ts';

const nativeServe = Bun.serve.bind(Bun);

function leadershipV2Headers(contentType:string){
  return new Headers({
    'content-type':contentType,
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
    'referrer-policy':'same-origin',
    'x-frame-options':'SAMEORIGIN',
    'content-security-policy':"default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; form-action 'self'",
  });
}

function allowScoped3dEmbedding(headers: Headers, pathname: string) {
  const isMapDocument = pathname === '/leadership' || pathname === '/map';
  const isHtmlPage = (headers.get('content-type') || '').includes('text/html');
  if (!isHtmlPage) return headers;

  let csp = headers.get('content-security-policy') || '';
  if (csp) {
    if (isMapDocument) {
      csp = csp.replace(/frame-ancestors\s+'none'/i, "frame-ancestors 'self'");
    } else {
      csp = csp.replace(/frame-src\s+'none'/i, "frame-src 'self'");
    }
    headers.set('content-security-policy', csp);
  }

  if (isMapDocument) headers.set('x-frame-options', 'SAMEORIGIN');
  return headers;
}

Bun.serve = function districtUxServe(options: any) {
  if (!options || typeof options.fetch !== 'function') return nativeServe(options);
  const innerFetch = options.fetch;
  return nativeServe({
    ...options,
    fetch: async (request: Request, server: any) => {
      const pathname = new URL(request.url).pathname;
      if(request.method==='GET'&&pathname==='/leadership'){
        return new Response(LEADERSHIP_V2_HTML,{status:200,headers:leadershipV2Headers('text/html; charset=utf-8')});
      }
      if(request.method==='GET'&&pathname==='/leadership-v2.css'){
        return new Response(LEADERSHIP_V2_CSS,{status:200,headers:leadershipV2Headers('text/css; charset=utf-8')});
      }
      if(request.method==='GET'&&pathname==='/leadership-v2.js'){
        return new Response(LEADERSHIP_V2_JS,{status:200,headers:leadershipV2Headers('application/javascript; charset=utf-8')});
      }
      const response = await innerFetch(request, server);
      try {
        const contentType = response?.headers?.get?.('content-type') || '';
        if (response instanceof Response && response.status >= 200 && response.status < 300 && contentType.includes('text/html')) {
          if (pathname === '/map') {
            const source = await response.text();
            const prepared = patchMapPrerequisites(source);
            const scopedHtml = patchInstitutionScope(prepared);
            const drilldownHtml = patchDistrictDrilldown3d(scopedHtml);
            const finalHtml = patchProvinceMarkerHardening(drilldownHtml);
            const headers = allowScoped3dEmbedding(new Headers(response.headers), pathname);
            headers.delete('content-length');
            headers.set('cache-control', 'no-store');
            return new Response(finalHtml, {
              status: response.status,
              statusText: response.statusText,
              headers,
            });
          }

          const headers = allowScoped3dEmbedding(new Headers(response.headers), pathname);
          if (headers.get('content-security-policy') !== response.headers.get('content-security-policy')) {
            headers.delete('content-length');
            headers.set('cache-control', 'no-store');
            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers,
            });
          }
        }
      } catch (e) {
        console.error('DISTRICT_UX_PATCH_FAILED', e instanceof Error ? e.message : String(e));
      }
      return response;
    },
  });
};

await import('./mobile-wrapper.ts');
