const realServe = Bun.serve.bind(Bun);

function publicOriginFor(request: Request) {
  const url = new URL(request.url);
  const headers = request.headers;
  const forwardedHost = (headers.get('x-forwarded-host') || '').split(',')[0].trim();
  const host = forwardedHost || headers.get('host') || url.host;
  const forwardedProto = (headers.get('x-forwarded-proto') || '').split(',')[0].trim();
  const proto = forwardedProto || (host.endsWith('.up.railway.app') ? 'https' : url.protocol.replace(':',''));
  return `${proto}://${host}`;
}

function normalizeSameOriginRequest(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const expected = publicOriginFor(request);
  let shouldNormalize = false;

  if (fetchSite === 'same-origin') {
    shouldNormalize = !origin || origin === 'null' || origin !== expected;
  } else if (origin && origin !== 'null') {
    try {
      const actual = new URL(origin);
      const target = new URL(expected);
      shouldNormalize = actual.hostname === target.hostname && actual.port === target.port && actual.origin !== target.origin;
    } catch {}
  }

  if (!shouldNormalize) return request;
  const headers = new Headers(request.headers);
  headers.set('origin', expected);
  return new Request(request, { headers });
}

Bun.serve = function mobileCompatibleServe(options: any) {
  if (!options || typeof options.fetch !== 'function') return realServe(options);
  const innerFetch = options.fetch;
  return realServe({
    ...options,
    fetch: (request: Request, server: any) => innerFetch(normalizeSameOriginRequest(request), server),
  });
};

await import('./wrapper.ts');
