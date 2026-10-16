import postgres from 'postgres';
import { createHash } from 'node:crypto';

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

// Keep the persistent ADMIN row synchronized with Railway ADMIN_* variables.
// The base application only seeds ADMIN when the row is absent, so changing env
// variables alone would otherwise leave the old password hash in PostgreSQL.
const adminUser = (Bun.env.ADMIN_USERNAME || '').trim();
const adminPass = Bun.env.ADMIN_PASSWORD || '';
const databaseUrl = Bun.env.DATABASE_URL || '';
let adminSyncDb: ReturnType<typeof postgres> | null = null;
let adminSyncKey = '';
let adminNeedsReseed = false;

if (databaseUrl && adminUser && adminPass) {
  try {
    adminSyncDb = postgres(databaseUrl, { max: 1, idle_timeout: 10 });
    await adminSyncDb`CREATE TABLE IF NOT EXISTS app_runtime_migrations (
      key text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`;
    adminSyncKey = 'admin-env-sync:' + createHash('sha256')
      .update(adminUser + '\u0000' + adminPass)
      .digest('hex')
      .slice(0, 24);
    const done = await adminSyncDb`SELECT 1 FROM app_runtime_migrations WHERE key=${adminSyncKey} LIMIT 1`;
    if (!done.length) {
      const table = await adminSyncDb`SELECT to_regclass('public.app_users')::text AS name`;
      if (table[0]?.name) {
        try {
          await adminSyncDb.unsafe(`DELETE FROM app_users WHERE upper(role::text)='ADMIN'`);
          adminNeedsReseed = true;
        } catch {
          try {
            await adminSyncDb`DELETE FROM app_users WHERE lower(login)=lower(${adminUser})`;
            adminNeedsReseed = true;
          } catch {}
        }
      }
    }
  } catch (e) {
    console.error('ADMIN_SYNC_PREP_FAILED', e instanceof Error ? e.message : String(e));
  }
}

await import('./wrapper.ts');

if (adminSyncDb) {
  try {
    if (adminNeedsReseed && adminSyncKey) {
      await adminSyncDb`INSERT INTO app_runtime_migrations (key) VALUES (${adminSyncKey}) ON CONFLICT (key) DO NOTHING`;
      console.log('ADMIN_CREDENTIALS_SYNCED');
    }
  } catch (e) {
    console.error('ADMIN_SYNC_FINALIZE_FAILED', e instanceof Error ? e.message : String(e));
  } finally {
    await adminSyncDb.end({ timeout: 2 }).catch(() => {});
  }
}
