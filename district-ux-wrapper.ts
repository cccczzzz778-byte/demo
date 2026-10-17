import { randomBytes } from 'node:crypto';
import { patchMapPrerequisites } from './map-prerequisites-patch.ts';
import { patchInstitutionScope } from './institution-scope-patch.ts';
import { patchDistrictDrilldown3d } from './district-drilldown-patch.ts';
import { patchProvinceMarkerHardening } from './province-marker-hardening-patch.ts';
import { patchLeadershipDistrictSwitch } from './leadership-district-switch-patch.ts';
import { UPLOADED_LEADERSHIP_HTML } from './leadership-uploaded-source.ts';

const nativeServe = Bun.serve.bind(Bun);

function renderUploadedLeadership() {
  const nonce = randomBytes(16).toString('base64');
  const html = patchLeadershipDistrictSwitch(UPLOADED_LEADERSHIP_HTML)
    .replace(/<style(?![^>]*\bnonce=)/g, `<style nonce="${nonce}"`)
    .replace(/<script(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`);
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'same-origin',
    'x-frame-options': 'SAMEORIGIN',
    'content-security-policy': [
      "default-src 'self'",
      "base-uri 'none'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "style-src-attr 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
    ].join('; '),
  });
  return new Response(html, { status: 200, headers });
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
      if (request.method === 'GET' && pathname === '/leadership') {
        return renderUploadedLeadership();
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