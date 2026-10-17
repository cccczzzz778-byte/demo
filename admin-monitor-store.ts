import { createHash } from 'node:crypto';

export type MonitorSqlLike = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]>;
  unsafe(query: string, params?: unknown[]): Promise<any[]>;
};

export type PresenceActor = {
  username: string;
  role: string;
  scopeType: string | null;
  districtId: string | null;
  facilityId: string | null;
};

export type PresenceMeta = {
  sessionToken: string;
  userAgent: string | null;
  ip: string | null;
};

export type SessionPresence = {
  sessionHash: string;
  username: string;
  role: string;
  scopeType: string | null;
  districtId: string | null;
  facilityId: string | null;
  device: string;
  browser: string;
  firstSeen: string;
  lastSeen: string;
};

const PRESENCE_SCHEMA = `CREATE TABLE IF NOT EXISTS app_session_presence (
  session_hash text PRIMARY KEY,
  username text NOT NULL,
  role text NOT NULL,
  scope_type text NULL,
  district_id text NULL,
  facility_id text NULL,
  device text NOT NULL,
  browser text NOT NULL,
  ip_hash text NULL,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
)`;

const REVOKED_SCHEMA = `CREATE TABLE IF NOT EXISTS app_revoked_sessions (
  session_hash text PRIMARY KEY,
  revoked_by text NOT NULL,
  revoked_at timestamptz NOT NULL DEFAULT now()
)`;

const lastPresenceWrite = new Map<string, number>();
const PRESENCE_THROTTLE_MS = 60_000;

let requestTotal = 0;
let serverErrorTotal = 0;
let durationTotalMs = 0;

export async function ensureMonitorSchema(sql: MonitorSqlLike): Promise<void> {
  await sql.unsafe(PRESENCE_SCHEMA);
  await sql.unsafe(REVOKED_SCHEMA);
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(String(token || '')).digest('hex');
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip).digest('hex');
}

export function parseUserAgent(userAgent: string | null): { device: string; browser: string } {
  const ua = String(userAgent || '');
  const device = /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /Edg\//i.test(ua) ? 'Edge'
    : /Chrome\//i.test(ua) || /CriOS\//i.test(ua) ? 'Chrome'
    : /Firefox\//i.test(ua) || /FxiOS\//i.test(ua) ? 'Firefox'
    : /Safari\//i.test(ua) ? 'Safari'
    : 'Other';
  return { device, browser };
}

export async function touchPresence(
  sql: MonitorSqlLike,
  actor: PresenceActor,
  meta: PresenceMeta,
  options: { force?: boolean } = {},
): Promise<boolean> {
  if (!meta.sessionToken || !actor.username) return false;
  const sessionHash = hashSessionToken(meta.sessionToken);
  const now = Date.now();
  const last = lastPresenceWrite.get(sessionHash) || 0;
  if (!options.force && now - last < PRESENCE_THROTTLE_MS) return false;
  const { device, browser } = parseUserAgent(meta.userAgent);
  const ipHash = hashIp(meta.ip);
  await sql`INSERT INTO app_session_presence(session_hash,username,role,scope_type,district_id,facility_id,device,browser,ip_hash,first_seen,last_seen)
    VALUES(${sessionHash},${actor.username},${actor.role},${actor.scopeType},${actor.districtId},${actor.facilityId},${device},${browser},${ipHash},now(),now())
    ON CONFLICT(session_hash) DO UPDATE SET username=EXCLUDED.username,role=EXCLUDED.role,scope_type=EXCLUDED.scope_type,district_id=EXCLUDED.district_id,facility_id=EXCLUDED.facility_id,device=EXCLUDED.device,browser=EXCLUDED.browser,ip_hash=EXCLUDED.ip_hash,last_seen=now()`;
  lastPresenceWrite.set(sessionHash, now);
  return true;
}

export async function listPresence(sql: MonitorSqlLike): Promise<SessionPresence[]> {
  const rows = await sql`SELECT session_hash,username,role,scope_type,district_id,facility_id,device,browser,first_seen,last_seen FROM app_session_presence ORDER BY last_seen DESC`;
  return rows.map((r: any) => ({
    sessionHash: String(r.session_hash), username: String(r.username), role: String(r.role),
    scopeType: r.scope_type ?? null, districtId: r.district_id ?? null, facilityId: r.facility_id ?? null,
    device: String(r.device), browser: String(r.browser), firstSeen: String(r.first_seen), lastSeen: String(r.last_seen),
  }));
}

export async function revokeSession(sql: MonitorSqlLike, sessionHash: string, actorUsername: string): Promise<void> {
  const actor = String(actorUsername || '').trim().toLowerCase();
  await sql`INSERT INTO app_revoked_sessions(session_hash,revoked_by,revoked_at) VALUES(${sessionHash},${actor},now())
    ON CONFLICT(session_hash) DO UPDATE SET revoked_by=EXCLUDED.revoked_by,revoked_at=now()`;
  await sql`INSERT INTO app_admin_audit(actor_username,action,target_id,details) VALUES(${actor},'SESSION_REVOKE',${sessionHash},'{}'::jsonb)`;
}

export async function isSessionRevoked(sql: MonitorSqlLike, sessionHash: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM app_revoked_sessions WHERE session_hash=${sessionHash} LIMIT 1`;
  return rows.length > 0;
}

export function recordHttpResult(status: number, durationMs: number): void {
  requestTotal += 1;
  if (status >= 500 && status <= 599) serverErrorTotal += 1;
  durationTotalMs += Math.max(0, Number(durationMs) || 0);
}

export function getRuntimeMetrics() {
  return {
    requestTotal,
    serverErrorTotal,
    serverErrorRate: requestTotal ? serverErrorTotal / requestTotal : 0,
    averageDurationMs: requestTotal ? durationTotalMs / requestTotal : 0,
  };
}

export function _resetRuntimeMetricsForTests(): void {
  requestTotal = 0;
  serverErrorTotal = 0;
  durationTotalMs = 0;
  lastPresenceWrite.clear();
}
