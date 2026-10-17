import type { AccessProfile } from './rbac';

export type SqlLike = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]>;
  unsafe(query: string, params?: unknown[]): Promise<any[]>;
  json(value: unknown): unknown;
};

export type AdminAuditEvent = {
  actorUsername: string | null;
  action: string;
  targetId: string | null;
  details?: unknown;
};

const ACCESS_SCHEMA = `CREATE TABLE IF NOT EXISTS app_access_profiles (
  username text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('SUPER_ADMIN','ADMIN','CONTROL_ADMIN','FACILITY')),
  scope_type text NOT NULL CHECK (scope_type IN ('province','district','facility')),
  district_id text NULL,
  facility_id text NULL,
  control_mode text NULL CHECK (control_mode IS NULL OR control_mode IN ('active','viewer')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (role='SUPER_ADMIN' AND scope_type='province' AND district_id IS NULL AND facility_id IS NULL AND control_mode IS NULL)
    OR (role='ADMIN' AND scope_type='district' AND district_id IS NOT NULL AND facility_id IS NULL AND control_mode IS NULL)
    OR (role='CONTROL_ADMIN' AND scope_type IN ('province','district') AND facility_id IS NULL AND control_mode IN ('active','viewer') AND ((scope_type='province' AND district_id IS NULL) OR (scope_type='district' AND district_id IS NOT NULL)))
    OR (role='FACILITY' AND scope_type='facility' AND facility_id IS NOT NULL AND control_mode IS NULL)
  )
)`;

const AUDIT_SCHEMA = `CREATE TABLE IF NOT EXISTS app_admin_audit (
  id bigserial PRIMARY KEY,
  actor_username text NULL,
  action text NOT NULL,
  target_id text NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
)`;

const SUPER_ADMIN_INDEX = `CREATE UNIQUE INDEX IF NOT EXISTS app_access_profiles_one_super_admin
  ON app_access_profiles (role) WHERE role='SUPER_ADMIN'`;

export function normalizeUsername(username: string): string {
  return String(username || '').trim().toLowerCase();
}

export function validateAccessProfile(profile: AccessProfile): void {
  const username = normalizeUsername(profile.username);
  if (!username) throw new Error('username required');

  if (profile.role === 'SUPER_ADMIN') {
    if (profile.scopeType !== 'province' || profile.districtId !== null || profile.facilityId !== null || profile.controlMode !== null) {
      throw new Error('invalid SUPER_ADMIN profile');
    }
    return;
  }
  if (profile.role === 'ADMIN') {
    if (profile.scopeType !== 'district' || !profile.districtId || profile.facilityId !== null || profile.controlMode !== null) {
      throw new Error('ADMIN requires exactly one district');
    }
    return;
  }
  if (profile.role === 'CONTROL_ADMIN') {
    if ((profile.controlMode !== 'active' && profile.controlMode !== 'viewer') || profile.facilityId !== null) {
      throw new Error('CONTROL_ADMIN requires active/viewer mode');
    }
    if (profile.scopeType === 'province') {
      if (profile.districtId !== null) throw new Error('province CONTROL_ADMIN cannot have district');
      return;
    }
    if (profile.scopeType === 'district' && !!profile.districtId) return;
    throw new Error('invalid CONTROL_ADMIN scope');
  }
  if (profile.role === 'FACILITY') {
    if (profile.scopeType !== 'facility' || !profile.facilityId || profile.controlMode !== null) throw new Error('invalid FACILITY profile');
    return;
  }
  throw new Error('invalid role');
}

export async function ensureRbacSchema(sql: SqlLike): Promise<void> {
  await sql.unsafe(ACCESS_SCHEMA);
  await sql.unsafe(AUDIT_SCHEMA);
  await sql.unsafe(SUPER_ADMIN_INDEX);
}

function mapProfile(row: any): AccessProfile | null {
  if (!row) return null;
  const profile: AccessProfile = {
    username: String(row.username),
    role: row.role,
    scopeType: row.scope_type,
    districtId: row.district_id ?? null,
    facilityId: row.facility_id ?? null,
    controlMode: row.control_mode ?? null,
    active: row.active !== false,
  };
  validateAccessProfile(profile);
  return profile;
}

export async function getProfile(sql: SqlLike, username: string): Promise<AccessProfile | null> {
  const key = normalizeUsername(username);
  if (!key) return null;
  const rows = await sql`SELECT username,role,scope_type,district_id,facility_id,control_mode,active FROM app_access_profiles WHERE username=${key} LIMIT 1`;
  return mapProfile(rows[0]);
}

export async function upsertAdminProfile(sql: SqlLike, profile: AccessProfile): Promise<AccessProfile> {
  validateAccessProfile(profile);
  const username = normalizeUsername(profile.username);
  const rows = await sql`INSERT INTO app_access_profiles(username,role,scope_type,district_id,facility_id,control_mode,active,updated_at)
    VALUES(${username},${profile.role},${profile.scopeType},${profile.districtId},${profile.facilityId},${profile.controlMode},${profile.active},now())
    ON CONFLICT(username) DO UPDATE SET role=EXCLUDED.role,scope_type=EXCLUDED.scope_type,district_id=EXCLUDED.district_id,facility_id=EXCLUDED.facility_id,control_mode=EXCLUDED.control_mode,active=EXCLUDED.active,updated_at=now()
    RETURNING username,role,scope_type,district_id,facility_id,control_mode,active`;
  return mapProfile(rows[0]) ?? { ...profile, username };
}

export async function setProfileActive(sql: SqlLike, username: string, active: boolean): Promise<boolean> {
  const key = normalizeUsername(username);
  const rows = await sql`UPDATE app_access_profiles SET active=${!!active},updated_at=now() WHERE username=${key} AND role<>'SUPER_ADMIN' RETURNING username`;
  return rows.length > 0;
}

export async function listAdminProfiles(sql: SqlLike): Promise<AccessProfile[]> {
  const rows = await sql`SELECT username,role,scope_type,district_id,facility_id,control_mode,active FROM app_access_profiles WHERE role IN ('SUPER_ADMIN','ADMIN','CONTROL_ADMIN') ORDER BY role,username`;
  return rows.map(mapProfile).filter(Boolean) as AccessProfile[];
}

const SENSITIVE_KEY = /(password|passphrase|hash|token|secret|credential)/i;

export function redactAuditDetails(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditDetails);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) continue;
    out[key] = redactAuditDetails(item);
  }
  return out;
}

export async function appendAdminAudit(sql: SqlLike, event: AdminAuditEvent): Promise<void> {
  const actor = event.actorUsername ? normalizeUsername(event.actorUsername) : null;
  const clean = redactAuditDetails(event.details ?? {});
  await sql`INSERT INTO app_admin_audit(actor_username,action,target_id,details) VALUES(${actor},${String(event.action)},${event.targetId ?? null},${sql.json(clean)})`;
}

export async function bootstrapExistingAdmin(sql: SqlLike, legacyUsername = 'admin'): Promise<'created' | 'exists' | 'missing'> {
  const existing = await sql`SELECT username FROM app_access_profiles WHERE role='SUPER_ADMIN' LIMIT 1`;
  if (existing.length) return 'exists';
  const username = normalizeUsername(legacyUsername);
  const users = await sql`SELECT username FROM app_users WHERE lower(username)=${username} LIMIT 1`;
  if (!users.length) return 'missing';
  await sql`INSERT INTO app_access_profiles(username,role,scope_type,district_id,facility_id,control_mode,active)
    VALUES(${username},'SUPER_ADMIN','province',NULL,NULL,NULL,true)
    ON CONFLICT(username) DO UPDATE SET role='SUPER_ADMIN',scope_type='province',district_id=NULL,facility_id=NULL,control_mode=NULL,active=true,updated_at=now()`;
  return 'created';
}
