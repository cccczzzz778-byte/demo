import { patchLeadership3d } from './leadership-3d-patch.ts';
import { patchMapPrerequisites } from './map-prerequisites-patch.ts';
import { patchLeadershipRuntimeFix } from './leadership-3d-runtime-fix.ts';
import { patch3dPerformanceAndFacilityFocus } from './leadership-performance-patch.ts';
import { patchOriginalMapColors } from './leadership-original-colors-patch.ts';
import { patchMapModesTv } from './leadership-map-modes-patch.ts';
import { patchDpmCityMap } from './dpm-city-map-patch.ts';
import { patchResidentialAndDpmLayout } from './residential-dpm-layout-patch.ts';

const nativeServe = Bun.serve.bind(Bun);

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
        if ((pathname === '/leadership' || pathname === '/map') && response instanceof Response && response.status >= 200 && response.status < 300 && contentType.includes('text/html')) {
          const source = await response.text();
          const prepared = pathname === '/map' ? patchMapPrerequisites(source) : source;
          const redesigned = patchLeadershipRuntimeFix(patchLeadership3d(prepared));
          const optimized = patch3dPerformanceAndFacilityFocus(redesigned);
          const originalColors = patchOriginalMapColors(optimized);
          const modeHtml = patchMapModesTv(originalColors);
          const dpmHtml = patchDpmCityMap(modeHtml);
          const finalHtml = patchResidentialAndDpmLayout(dpmHtml);
          const headers = new Headers(response.headers);
          headers.delete('content-length');
          headers.set('cache-control', 'no-store');
          return new Response(finalHtml, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
      } catch (e) {
        console.error('LEADERSHIP_3D_PATCH_FAILED', e instanceof Error ? e.message : String(e));
      }
      return response;
    },
  });
};

await import('./mobile-wrapper.ts');
