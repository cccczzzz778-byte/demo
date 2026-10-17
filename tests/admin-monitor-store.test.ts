import { beforeEach, describe, expect, test } from 'bun:test';
import {
  _resetRuntimeMetricsForTests,
  ensureMonitorSchema,
  getRuntimeMetrics,
  hashSessionToken,
  parseUserAgent,
  recordHttpResult,
  revokeSession,
  touchPresence,
  type MonitorSqlLike,
} from '../admin-monitor-store';

function fakeSql(){
  const unsafeCalls:string[]=[];
  const tagCalls:{text:string;values:unknown[]}[]=[];
  const sql=(async(strings:TemplateStringsArray,...values:unknown[])=>{
    tagCalls.push({text:strings.join('?').replace(/\s+/g,' ').trim(),values});
    return [];
  }) as unknown as MonitorSqlLike;
  sql.unsafe=async(q:string)=>{unsafeCalls.push(q);return []};
  return {sql,unsafeCalls,tagCalls};
}

beforeEach(()=>_resetRuntimeMetricsForTests());

describe('monitor schema',()=>{
  test('creates idempotent presence and revoked-session companion tables',async()=>{
    const f=fakeSql();
    await ensureMonitorSchema(f.sql); await ensureMonitorSchema(f.sql);
    const ddl=f.unsafeCalls.join('\n');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS app_session_presence');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS app_revoked_sessions');
    expect(ddl).not.toContain('ALTER TABLE app_users');
  });
});

describe('opaque session handling',()=>{
  test('hashes a raw session token with SHA-256 and never returns the token',()=>{
    const raw='header.payload.signature-secret';
    const h=hashSessionToken(raw);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain(raw);
    expect(hashSessionToken(raw)).toBe(h);
  });

  test('stores only the session hash plus coarse device/browser metadata',async()=>{
    const f=fakeSql();
    const raw='session-token-plain';
    const touched=await touchPresence(f.sql,{
      username:'gij-admin',role:'ADMIN',scopeType:'district',districtId:"G'ijduvon",facilityId:null,
    },{
      sessionToken:raw,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/155.0 Mobile Safari/537.36',ip:'10.0.0.5',
    },{force:true});
    expect(touched).toBe(true);
    const values=JSON.stringify(f.tagCalls.at(-1)?.values||[]);
    expect(values).not.toContain(raw);
    expect(values).toContain(hashSessionToken(raw));
    expect(values).toContain('mobile');
    expect(values).toContain('Chrome');
    expect(values).not.toContain('10.0.0.5');
  });

  test('parses coarse browser/device labels only',()=>{
    expect(parseUserAgent('Mozilla/5.0 Android Chrome/155 Mobile Safari/537.36')).toEqual({device:'mobile',browser:'Chrome'});
    expect(parseUserAgent('Mozilla/5.0 Windows NT 10.0 Edg/155.0')).toEqual({device:'desktop',browser:'Edge'});
  });
});

describe('session revocation',()=>{
  test('records an opaque hash and a redacted audit event shape',async()=>{
    const f=fakeSql();
    const hash=hashSessionToken('secret-session');
    await revokeSession(f.sql,hash,'admin');
    const all=JSON.stringify(f.tagCalls);
    expect(all).toContain(hash);
    expect(all).toContain('SESSION_REVOKE');
    expect(all).toContain('admin');
    expect(all).not.toContain('secret-session');
  });
});

describe('runtime metrics',()=>{
  test('aggregates request totals, 5xx count/rate and duration without request contents',()=>{
    recordHttpResult(200,12);
    recordHttpResult(503,30);
    recordHttpResult(500,18);
    const m=getRuntimeMetrics();
    expect(m.requestTotal).toBe(3);
    expect(m.serverErrorTotal).toBe(2);
    expect(m.serverErrorRate).toBeCloseTo(2/3,6);
    expect(m.averageDurationMs).toBe(20);
  });
});
