import { randomBytes } from 'node:crypto';
import { patchMapPrerequisites } from './map-prerequisites-patch.ts';
import { patchInstitutionScope } from './institution-scope-patch.ts';
import { patchDistrictDrilldown3d } from './district-drilldown-patch.ts';
import { patchProvinceMarkerHardening } from './province-marker-hardening-patch.ts';
import { patchLeadershipDistrictSwitch } from './leadership-district-switch-patch.ts';
import { patchLeadershipDistrictDashboardStyle } from './leadership-district-dashboard-style-patch.ts';
import { patchLeadershipDistrictMapFocus } from './leadership-district-map-focus-patch.ts';
import { patchLeadershipDistrictLegend } from './leadership-district-legend-patch.ts';
import { patchLeadershipViewModes } from './leadership-view-modes-patch.ts';
import { patchLeadershipDemography } from './leadership-demography-patch.ts';
import { patchLeadershipAiForecast } from './leadership-ai-forecast-patch.ts';
import { patchLeadershipHealthStats } from './leadership-health-stats-patch.ts';
import { UPLOADED_LEADERSHIP_HTML } from './leadership-uploaded-source.ts';

const nativeServe = Bun.serve.bind(Bun);

function renderUploadedLeadership() {
  const nonce = randomBytes(16).toString('base64');
  const html = patchLeadershipHealthStats(
    patchLeadershipViewModes(
      patchLeadershipAiForecast(
        patchLeadershipDemography(
          patchLeadershipDistrictLegend(
            patchLeadershipDistrictMapFocus(
              patchLeadershipDistrictDashboardStyle(
                patchLeadershipDistrictSwitch(UPLOADED_LEADERSHIP_HTML)
              )
            )
          )
        )
      )
    )
  )
    .replace(/BUXORO VILOYATI TIBBIYOT MUASSASALARI/g, 'Buxoro viloyati SSB Dashboardi')
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function extractResponseText(payload: any) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const parts: string[] = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

async function handleAiForecast(request: Request) {
  const apiKey = Bun.env.OPENAI_API_KEY || Bun.env.AI_API_KEY;
  const model = Bun.env.AI_MODEL || 'gpt-6-luna';
  if (!apiKey) return jsonResponse({ enabled: false, error: 'AI_NOT_CONFIGURED' }, 503);

  try {
    const body = await request.json();
    const prompt = [
      'Siz Buxoro viloyati sog‘liqni saqlash boshqarmasi dashboardi uchun demografik tahlilchisiz.',
      'Faqat berilgan raqamlarga tayangan holda o‘zbek lotinida 2-3 qisqa gap yozing.',
      'Yangi raqam o‘ylab topmang. Prognoz taxminiy ekanini aniq ayting.',
      'Tug‘ilish, o‘lim va tabiiy o‘sish trendidan eng muhim xavf yoki ijobiy signalni ko‘rsating.',
      `Hudud: ${String(body?.name || 'Buxoro viloyati')}`,
      `Ma’lumot: ${JSON.stringify(body?.data || {})}`,
      `Statistik prognoz: ${JSON.stringify(body?.forecast || {})}`,
    ].join('\n');

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model, input: prompt }),
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) {
      console.error('AI_FORECAST_UPSTREAM_FAILED', upstream.status, (await upstream.text()).slice(0, 500));
      return jsonResponse({ enabled: true, error: 'AI_UPSTREAM_FAILED' }, 502);
    }
    const result = await upstream.json();
    const analysis = extractResponseText(result);
    if (!analysis) return jsonResponse({ enabled: true, error: 'AI_EMPTY_RESPONSE' }, 502);
    return jsonResponse({ enabled: true, model, analysis });
  } catch (e) {
    console.error('AI_FORECAST_FAILED', e instanceof Error ? e.message : String(e));
    return jsonResponse({ enabled: true, error: 'AI_FORECAST_FAILED' }, 500);
  }
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
      if (request.method === 'POST' && pathname === '/api/ai-forecast') {
        return handleAiForecast(request);
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