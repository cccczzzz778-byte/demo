const nativeServe = Bun.serve.bind(Bun);

const facilityMain = `<main class="wrap">
  <div class="hero">
    <div>
      <h1 id="cleanFacilityName">Muassasa dashboardi</h1>
      <div class="muted" id="cleanFacilityMeta">Muassasa ma’lumoti yuklanmoqda...</div>
    </div>
    <span class="pill">MUASSASA</span>
  </div>
  <section class="card section">
    <h3>Ma’lumot kiritish</h3>
    <div class="muted" style="font-size:16px;line-height:1.7;padding:18px 0">
      Kiritiladigan ko‘rsatkichlar hozircha belgilanmagan. Buxoro SSB tomonidan aniq ro‘yxat berilgandan keyin ushbu bo‘limda yangi ma’lumot kiritish formasi ochiladi.
    </div>
  </section>
</main>
<script>
api('/api/v1/facility').then(d => {
  const n = document.getElementById('cleanFacilityName');
  const m = document.getElementById('cleanFacilityMeta');
  if (n && d.institution) n.textContent = d.institution.name;
  if (m && d.institution) m.textContent = d.institution.type + ' · ' + d.institution.scope;
}).catch(e => toast(e.message));
</script>`;

Bun.serve = function patchedServe(options: any) {
  if (!options || typeof options.fetch !== 'function') return nativeServe(options);
  const originalFetch = options.fetch;
  return nativeServe({
    ...options,
    fetch: async (request: Request, server: any) => {
      const response = await originalFetch(request, server);
      try {
        const url = new URL(request.url);
        const contentType = response.headers.get('content-type') || '';
        if (url.pathname !== '/facility' || request.method !== 'GET' || response.status < 200 || response.status >= 300 || !contentType.includes('text/html')) {
          return response;
        }

        const html = await response.text();
        const cleaned = html.replace(/<main class="wrap">[\s\S]*?<\/main><script>[\s\S]*?<\/script>/, facilityMain);
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.set('cache-control', 'no-store');
        return new Response(cleaned, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch {
        return response;
      }
    },
  });
};

await import('./index.ts');
