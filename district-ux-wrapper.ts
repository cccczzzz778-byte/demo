import { patchMapPrerequisites } from './map-prerequisites-patch.ts';
import { patchInstitutionScope } from './institution-scope-patch.ts';
import { patchDistrictDrilldown3d } from './district-drilldown-patch.ts';

const nativeServe = Bun.serve.bind(Bun);

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
      const response = await innerFetch(request, server);
      try {
        const pathname = new URL(request.url).pathname;
        const contentType = response?.headers?.get?.('content-type') || '';
        if (response instanceof Response && response.status >= 200 && response.status < 300 && contentType.includes('text/html')) {
          if (pathname === '/leadership' || pathname === '/map') {
            const source = await response.text();
            const prepared = pathname === '/map' ? patchMapPrerequisites(source) : source;
            const scopedHtml = patchInstitutionScope(prepared);
            const finalHtml = patchDistrictDrilldown3d(scopedHtml);
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
