const realServe = Bun.serve.bind(Bun);
const unsafeMethods = new Set(['POST','PUT','PATCH','DELETE']);

function publicOriginFor(request: Request) {
  const url = new URL(request.url);
  const headers = request.headers;
  const forwardedHost = (headers.get('x-forwarded-host') || '').split(',')[0].trim();
  const host = forwardedHost || headers.get('host') || url.host;
  const forwardedProto = (headers.get('x-forwarded-proto') || '').split(',')[0].trim();
  const proto = forwardedProto || (host.endsWith('.up.railway.app') ? 'https' : url.protocol.replace(':',''));
  return `${proto}://${host}`;
}

function normalizeProxyRequest(request: Request) {
  if (!unsafeMethods.has(request.method)) return request;

  const url = new URL(request.url);
  const fetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const expected = publicOriginFor(request);
  const headers = new Headers(request.headers);
  let headersChanged = false;

  if (fetchSite === 'same-origin') {
    if (!origin || origin === 'null' || origin !== expected) {
      headers.set('origin', expected);
      headersChanged = true;
    }
  } else if (origin && origin !== 'null') {
    try {
      const actual = new URL(origin);
      const target = new URL(expected);
      if (actual.hostname === target.hostname && actual.port === target.port && actual.origin !== target.origin) {
        headers.set('origin', expected);
        headersChanged = true;
      }
    } catch {}
  }

  const urlChanged = url.origin !== expected;
  if (!headersChanged && !urlChanged) return request;

  const canonicalUrl = `${expected}${url.pathname}${url.search}`;
  return new Request(urlChanged ? canonicalUrl : request.url, {
    method: request.method,
    headers,
    body: request.body,
    redirect: request.redirect,
    signal: request.signal,
    // Bun accepts streamed request bodies with duplex=half.
    duplex: 'half' as any,
  } as any);
}

Bun.serve = function mobileCompatibleServe(options: any) {
  if (!options || typeof options.fetch !== 'function') return realServe(options);
  const innerFetch = options.fetch;
  return realServe({
    ...options,
    fetch: (request: Request, server: any) => innerFetch(normalizeProxyRequest(request), server),
  });
};

await import('./wrapper.ts');
