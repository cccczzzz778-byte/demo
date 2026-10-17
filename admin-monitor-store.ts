import { createHash, randomUUID } from 'node:crypto';
import type { AccessProfile } from './rbac.ts';

export type MonitorSql = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
export type RequestMeta = { sessionHash:string; ipHash:string|null; userAgent:string|null; district:string|null };

export function createSessionHash(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export function coarseUserAgent(ua: string | null) {
  const s=String(ua||'');
  const device=/mobile|android|iphone|ipad/i.test(s)?'Mobile':'Desktop';
  let browser='Other';
  if(/Edg\//.test(s)) browser='Edge'; else if(/Chrome\//.test(s)) browser='Chrome'; else if(/Firefox\//.test(s)) browser='Firefox'; else if(/Safari\//.test(s)&&!/Chrome\//.test(s)) browser='Safari';
  return {device,browser};
}

export async function ensureMonitorSchema(sql: MonitorSql) {
  await sql`CREATE TABLE IF NOT EXISTS app_session_presence(
    session_hash text PRIMARY KEY,
    username text NOT NULL,
    role text NOT NULL,
    district_id text,
    device text NOT NULL,
    browser text NOT NULL,
    ip_hash text,
    first_seen timestamptz NOT NULL DEFAULT now(),
    last_seen timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS app_session_presence_username_idx ON app_session_presence(username)`;
  await sql`CREATE INDEX IF NOT EXISTS app_session_presence_district_idx ON app_session_presence(district_id)`;
  await sql`CREATE TABLE IF NOT EXISTS app_revoked_sessions(
    session_hash text PRIMARY KEY,
    revoked_by text NOT NULL,
    revoked_at timestamptz NOT NULL DEFAULT now()
  )`;
}

export async function touchPresence(sql: MonitorSql, actor: {username:string; role:string}, meta: RequestMeta) {
  const ua=coarseUserAgent(meta.userAgent);
  await sql`INSERT INTO app_session_presence(session_hash,username,role,district_id,device,browser,ip_hash)
    VALUES(${meta.sessionHash},${actor.username},${actor.role},${meta.district},${ua.device},${ua.browser},${meta.ipHash})
    ON CONFLICT(session_hash) DO UPDATE SET username=EXCLUDED.username,role=EXCLUDED.role,district_id=EXCLUDED.district_id,device=EXCLUDED.device,browser=EXCLUDED.browser,ip_hash=EXCLUDED.ip_hash,last_seen=now()`;
}

export async function listPresence(sql: MonitorSql, scope: {scopeType:'province'|'district';districtId?:string|null}) {
  if(scope.scopeType==='province') return sql`SELECT session_hash,username,role,district_id,device,browser,first_seen,last_seen FROM app_session_presence WHERE last_seen > now()-interval '12 hours' ORDER BY last_seen DESC`;
  return sql`SELECT session_hash,username,role,district_id,device,browser,first_seen,last_seen FROM app_session_presence WHERE district_id=${scope.districtId ?? null} AND last_seen > now()-interval '12 hours' ORDER BY last_seen DESC`;
}

export async function revokeSession(sql: MonitorSql, sessionHash: string, actor: AccessProfile) {
  if(actor.role!=='SUPER_ADMIN') throw new Error('SUPER_ADMIN_REQUIRED');
  await sql`INSERT INTO app_revoked_sessions(session_hash,revoked_by) VALUES(${sessionHash},${actor.username}) ON CONFLICT(session_hash) DO UPDATE SET revoked_by=EXCLUDED.revoked_by,revoked_at=now()`;
  await sql`INSERT INTO app_admin_audit(id,actor_username,action,target,details) VALUES(${randomUUID()},${actor.username},'SESSION_REVOKE',${sessionHash},'{}'::jsonb)`;
}

export async function isSessionRevoked(sql: MonitorSql, sessionHash: string) {
  const rows=await sql`SELECT 1 FROM app_revoked_sessions WHERE session_hash=${sessionHash} LIMIT 1`;
  return rows.length>0;
}

let requestTotal=0, error5xx=0, totalDurationMs=0;
export function recordHttpResult(status:number,durationMs:number) {
  requestTotal++; if(status>=500&&status<600) error5xx++; totalDurationMs+=Math.max(0,Number(durationMs)||0);
}
export function getRuntimeMetrics() {
  const mem=process.memoryUsage();
  return {
    requestTotal,
    error5xx,
    error5xxRate:requestTotal?error5xx/requestTotal:0,
    averageDurationMs:requestTotal?totalDurationMs/requestTotal:0,
    uptimeSeconds:Math.floor(process.uptime()),
    memoryRssMb:Math.round(mem.rss/1024/1024*10)/10,
    memoryHeapMb:Math.round(mem.heapUsed/1024/1024*10)/10,
  };
}
