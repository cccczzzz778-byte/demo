import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import postgres from 'postgres';
import { handleAdminApi, type AdminApiDeps } from './super-admin-api.ts';
import { appendAdminAudit, bootstrapSuperAdmin, ensureRbacSchema, getProfile, listAdminProfiles, upsertAdminProfile } from './rbac-store.ts';

const nativeServe = Bun.serve.bind(Bun);
const databaseUrl = Bun.env.DATABASE_URL || '';
const db = databaseUrl ? postgres(databaseUrl, { max: 4, idle_timeout: 20, connect_timeout: 15 }) : null;

function legacyPasswordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `s1$${salt}$${hash}`;
}

if (db) {
  await ensureRbacSchema(db as any);
  await bootstrapSuperAdmin(db as any, 'admin');
}

const deps: AdminApiDeps = {
  getProfile: async (username) => db ? getProfile(db as any, username) : null,
  listAdminProfiles: async () => db ? listAdminProfiles(db as any) : [],
  upsertAdminProfile: async (profile) => { if (!db) throw new Error('DATABASE_UNAVAILABLE'); await upsertAdminProfile(db as any, profile); },
  appendAudit: async (event) => { if (db) await appendAdminAudit(db as any, event); },
  createAdminAccount: async ({ username, password, scope }) => {
    if (!db) throw new Error('DATABASE_UNAVAILABLE');
    if (password.length < 8 || password.length > 128) throw new Error('INVALID_PASSWORD');
    const normalized = username.trim().toLowerCase(); if (!normalized) throw new Error('INVALID_USERNAME');
    const id = randomUUID();
    await db`INSERT INTO app_users(id,username,password_hash,role,institution_id,scope,active) VALUES(${id},${normalized},${legacyPasswordHash(password)},'ADMIN',NULL,${scope},true)`;
    return { id, username: normalized };
  },
};

function isDirectLegacyUserManagement(pathname: string) {
  return /^\/api\/v1\/(?:admin|region)\/users(?:\/|$)/.test(pathname);
}

Bun.serve = function superAdminServe(options: any) {
  if (!options || typeof options.fetch !== 'function') return nativeServe(options);
  const innerFetch = options.fetch;
  return nativeServe({
    ...options,
    fetch: async (request: Request, server: any) => {
      const pathname = new URL(request.url).pathname;
      if (pathname.startsWith('/api/control/')) {
        if (!db) return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers: { 'content-type': 'application/json' } });
        const handled = await handleAdminApi(request, innerFetch, deps);
        if (handled) return handled;
      }
      if (isDirectLegacyUserManagement(pathname)) {
        return new Response(JSON.stringify({ error: 'Use scoped control API' }), { status: 403, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      }
      return innerFetch(request, server);
    },
  });
};

await import('./district-ux-wrapper.ts');
