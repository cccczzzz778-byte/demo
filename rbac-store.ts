import type { AccessProfile } from './rbac.ts';

export type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;

export function validateAccessProfile(profile: AccessProfile): { ok: true } | { ok: false; error: string } {
  if (!profile.username?.trim()) return { ok:false, error:'username-required' };
  if (profile.role === 'SUPER_ADMIN') {
    if (profile.scopeType !== 'province' || profile.districtId || profile.facilityId || profile.controlMode) return { ok:false, error:'invalid-super-admin-scope' };
    return { ok:true };
  }
  if (profile.role === 'ADMIN') {
    if (profile.scopeType !== 'district' || !profile.districtId || profile.facilityId || profile.controlMode) return { ok:false, error:'admin-requires-one-district' };
    return { ok:true };
  }
  if (profile.role === 'CONTROL_ADMIN') {
    if (!['province','district'].includes(profile.scopeType)) return { ok:false, error:'invalid-control-scope' };
    if (profile.scopeType === 'district' && !profile.districtId) return { ok:false, error:'control-district-required' };
    if (profile.scopeType === 'province' && profile.districtId) return { ok:false, error:'province-control-no-district' };
    if (!['active','viewer'].includes(String(profile.controlMode))) return { ok:false, error:'control-mode-required' };
    if (profile.facilityId) return { ok:false, error:'control-no-facility' };
    return { ok:true };
  }
  if (profile.role === 'FACILITY') {
    if (profile.scopeType !== 'facility' || !profile.facilityId || profile.districtId || profile.controlMode) return { ok:false, error:'facility-scope-required' };
    return { ok:true };
  }
  return { ok:false, error:'unknown-role' };
}

export function redactAuditDetails(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditDetails);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k,v] of Object.entries(value as Record<string, unknown>)) {
    if (/(password|hash|token|secret)/i.test(k)) out[k] = '[REDACTED]';
    else out[k] = redactAuditDetails(v);
  }
  return out;
}

export async function ensureRbacSchema(sql: SqlTag) {
  await sql`CREATE TABLE IF NOT EXISTS app_access_profiles(
    username text PRIMARY KEY,
    role text NOT NULL CHECK(role IN ('SUPER_ADMIN','ADMIN','CONTROL_ADMIN','FACILITY')),
    scope_type text NOT NULL CHECK(scope_type IN ('province','district','facility')),
    district_id text,
    facility_id text,
    control_mode text CHECK(control_mode IS NULL OR control_mode IN ('active','viewer')),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK(
      (role='SUPER_ADMIN' AND scope_type='province' AND district_id IS NULL AND facility_id IS NULL AND control_mode IS NULL) OR
      (role='ADMIN' AND scope_type='district' AND district_id IS NOT NULL AND facility_id IS NULL AND control_mode IS NULL) OR
      (role='CONTROL_ADMIN' AND scope_type IN ('province','district') AND facility_id IS NULL AND control_mode IN ('active','viewer') AND ((scope_type='province' AND district_id IS NULL) OR (scope_type='district' AND district_id IS NOT NULL))) OR
      (role='FACILITY' AND scope_type='facility' AND district_id IS NULL AND facility_id IS NOT NULL AND control_mode IS NULL)
    )
  )`;

  // Existing installations were created before FACILITY/facility were valid values.
  // Remove only the original generated checks, then replace them with stable v2 checks.
  await sql`ALTER TABLE app_access_profiles
    DROP CONSTRAINT IF EXISTS app_access_profiles_role_check,
    DROP CONSTRAINT IF EXISTS app_access_profiles_scope_type_check,
    DROP CONSTRAINT IF EXISTS app_access_profiles_check`;
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='app_access_profiles_role_check_v2' AND conrelid='app_access_profiles'::regclass) THEN
      ALTER TABLE app_access_profiles ADD CONSTRAINT app_access_profiles_role_check_v2 CHECK(role IN ('SUPER_ADMIN','ADMIN','CONTROL_ADMIN','FACILITY'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='app_access_profiles_scope_type_check_v2' AND conrelid='app_access_profiles'::regclass) THEN
      ALTER TABLE app_access_profiles ADD CONSTRAINT app_access_profiles_scope_type_check_v2 CHECK(scope_type IN ('province','district','facility'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='app_access_profiles_shape_check_v2' AND conrelid='app_access_profiles'::regclass) THEN
      ALTER TABLE app_access_profiles ADD CONSTRAINT app_access_profiles_shape_check_v2 CHECK(
        (role='SUPER_ADMIN' AND scope_type='province' AND district_id IS NULL AND facility_id IS NULL AND control_mode IS NULL) OR
        (role='ADMIN' AND scope_type='district' AND district_id IS NOT NULL AND facility_id IS NULL AND control_mode IS NULL) OR
        (role='CONTROL_ADMIN' AND scope_type IN ('province','district') AND facility_id IS NULL AND control_mode IN ('active','viewer') AND ((scope_type='province' AND district_id IS NULL) OR (scope_type='district' AND district_id IS NOT NULL))) OR
        (role='FACILITY' AND scope_type='facility' AND district_id IS NULL AND facility_id IS NOT NULL AND control_mode IS NULL)
      );
    END IF;
  END $$`;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS app_one_super_admin_idx ON app_access_profiles ((role)) WHERE role='SUPER_ADMIN'`;
  await sql`CREATE TABLE IF NOT EXISTS app_admin_audit(
    id text PRIMARY KEY,
    actor_username text,
    action text NOT NULL,
    target text,
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
}

function rowToProfile(row: any): AccessProfile {
  return { username: row.username, role: row.role, scopeType: row.scope_type, districtId: row.district_id ?? null, facilityId: row.facility_id ?? null, controlMode: row.control_mode ?? null, active: !!row.active };
}

export async function getProfile(sql: SqlTag, username: string): Promise<AccessProfile | null> {
  const rows = await sql`SELECT username,role,scope_type,district_id,facility_id,control_mode,active FROM app_access_profiles WHERE lower(username)=lower(${username}) LIMIT 1`;
  return rows[0] ? rowToProfile(rows[0]) : null;
}

export async function listAdminProfiles(sql: SqlTag): Promise<AccessProfile[]> {
  const rows = await sql`SELECT username,role,scope_type,district_id,facility_id,control_mode,active FROM app_access_profiles WHERE role IN ('SUPER_ADMIN','ADMIN','CONTROL_ADMIN') ORDER BY role,username`;
  return rows.map(rowToProfile);
}

export async function upsertAdminProfile(sql: SqlTag, profile: AccessProfile) {
  const valid = validateAccessProfile(profile);
  if (!valid.ok) throw new Error(valid.error);
  if (profile.role === 'FACILITY') throw new Error('admin-profile-required');
  await sql`INSERT INTO app_access_profiles(username,role,scope_type,district_id,facility_id,control_mode,active)
    VALUES(${profile.username.toLowerCase()},${profile.role},${profile.scopeType},${profile.districtId},${profile.facilityId},${profile.controlMode},${profile.active})
    ON CONFLICT(username) DO UPDATE SET role=EXCLUDED.role,scope_type=EXCLUDED.scope_type,district_id=EXCLUDED.district_id,facility_id=EXCLUDED.facility_id,control_mode=EXCLUDED.control_mode,active=EXCLUDED.active,updated_at=now()`;
}

export async function upsertFacilityProfile(sql: SqlTag, profile: AccessProfile) {
  const valid = validateAccessProfile(profile);
  if (!valid.ok) throw new Error(valid.error);
  if (profile.role !== 'FACILITY') throw new Error('facility-profile-required');
  await sql`INSERT INTO app_access_profiles(username,role,scope_type,district_id,facility_id,control_mode,active)
    VALUES(${profile.username.toLowerCase()},'FACILITY','facility',NULL,${profile.facilityId},NULL,${profile.active})
    ON CONFLICT(username) DO UPDATE SET role='FACILITY',scope_type='facility',district_id=NULL,facility_id=EXCLUDED.facility_id,control_mode=NULL,active=EXCLUDED.active,updated_at=now()`;
}

export async function setProfileActive(sql: SqlTag, username: string, active: boolean) {
  await sql`UPDATE app_access_profiles SET active=${active},updated_at=now() WHERE lower(username)=lower(${username})`;
}

export async function bootstrapSuperAdmin(sql: SqlTag, username='admin') {
  const existing = await sql`SELECT username FROM app_access_profiles WHERE role='SUPER_ADMIN' LIMIT 1`;
  if (existing.length) return existing[0].username;
  await sql`INSERT INTO app_access_profiles(username,role,scope_type,district_id,facility_id,control_mode,active)
    VALUES(${username.toLowerCase()},'SUPER_ADMIN','province',NULL,NULL,NULL,true)
    ON CONFLICT(username) DO UPDATE SET role='SUPER_ADMIN',scope_type='province',district_id=NULL,facility_id=NULL,control_mode=NULL,active=true,updated_at=now()`;
  return username.toLowerCase();
}

export async function appendAdminAudit(sql: SqlTag, event: { id: string; actorUsername: string | null; action: string; target?: string | null; details?: unknown }) {
  const safe = redactAuditDetails(event.details ?? {});
  await sql`INSERT INTO app_admin_audit(id,actor_username,action,target,details) VALUES(${event.id},${event.actorUsername},${event.action},${event.target ?? null},${JSON.stringify(safe)})`;
}
