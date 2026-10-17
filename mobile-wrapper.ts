import postgres from 'postgres';
import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';

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

async function normalizeProxyRequest(request: Request) {
  if (!unsafeMethods.has(request.method)) return request;

  const url = new URL(request.url);
  const fetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const expected = publicOriginFor(request);
  const headers = new Headers(request.headers);
  let headersChanged = false;
  let bodyChanged = false;
  let replacementBody: string | null = null;

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

  // The base app keeps the ADMIN username as lowercase "admin".
  // Accept the requested user-facing "Admin" spelling without weakening auth.
  if (url.pathname === '/api/auth/login' && request.method === 'POST' && (headers.get('content-type') || '').toLowerCase().includes('application/json')) {
    try {
      const raw = await request.clone().text();
      const data = JSON.parse(raw || '{}');
      if (typeof data.username === 'string' && data.username.toLowerCase() === 'admin' && data.username !== 'admin') {
        data.username = 'admin';
        replacementBody = JSON.stringify(data);
        headers.delete('content-length');
        bodyChanged = true;
      }
    } catch {}
  }

  const urlChanged = url.origin !== expected;
  if (!headersChanged && !urlChanged && !bodyChanged) return request;

  const canonicalUrl = `${expected}${url.pathname}${url.search}`;
  return new Request(urlChanged ? canonicalUrl : request.url, {
    method: request.method,
    headers,
    body: bodyChanged ? replacementBody : request.body,
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
    fetch: async (request: Request, server: any) => innerFetch(await normalizeProxyRequest(request), server),
  });
};

function legacyPasswordMatches(stored: unknown, password: string) {
  try {
    if (typeof stored !== 'string') return false;
    const [version, salt, expectedHex, ...extra] = stored.split('$');
    if (version !== 's1' || !salt || !expectedHex || extra.length) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    if (expected.length !== 32) return false;
    const actual = scryptSync(password, salt, 32);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// The base application seeds username "admin" from ADMIN_DEFAULT_PASSWORD.
// Verify the root row on every startup so stale DB credentials cannot survive.
const adminUser = 'admin';
const adminPass = Bun.env.ADMIN_DEFAULT_PASSWORD || Bun.env.ADMIN_PASSWORD || '';
const databaseUrl = Bun.env.DATABASE_URL || '';
let adminSyncDb: ReturnType<typeof postgres> | null = null;
let adminSyncKey = '';
let adminNeedsReseed = false;

if (databaseUrl && adminPass) {
  try {
    adminSyncDb = postgres(databaseUrl, { max: 1, idle_timeout: 10 });
    await adminSyncDb`CREATE TABLE IF NOT EXISTS app_runtime_migrations (
      key text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`;
    adminSyncKey = 'admin-default-password-sync-v4:' + createHash('sha256')
      .update(adminUser + '\u0000' + adminPass)
      .digest('hex')
      .slice(0, 24);
    const table = await adminSyncDb`SELECT to_regclass('public.app_users')::text AS name`;
    if (table[0]?.name) {
      const rows = await adminSyncDb`SELECT password_hash FROM app_users WHERE username='admin' LIMIT 1`;
      if (!rows.length || !legacyPasswordMatches(rows[0]?.password_hash, adminPass)) {
        if (rows.length) await adminSyncDb`DELETE FROM app_users WHERE username='admin'`;
        adminNeedsReseed = true;
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
      console.log('ADMIN_CREDENTIALS_SYNCED_V4');
    }
  } catch (e) {
    console.error('ADMIN_SYNC_FINALIZE_FAILED', e instanceof Error ? e.message : String(e));
  } finally {
    await adminSyncDb.end({ timeout: 2 }).catch(() => {});
  }
}
