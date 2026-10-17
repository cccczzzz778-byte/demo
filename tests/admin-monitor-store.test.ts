import { describe, expect, test } from 'bun:test';
import { createSessionHash, coarseUserAgent, ensureMonitorSchema, recordHttpResult, getRuntimeMetrics } from '../admin-monitor-store.ts';

describe('admin monitor store',()=>{
  test('uses opaque deterministic sha256 session identifiers',()=>{
    const raw='ssb_session=very-secret-token';
    const h=createSessionHash(raw);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).not.toContain('very-secret-token');
    expect(createSessionHash(raw)).toBe(h);
  });

  test('coarsens browser/device metadata',()=>{
    const m=coarseUserAgent('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/155.0 Mobile Safari/537.36');
    expect(m.device).toBe('Mobile');
    expect(m.browser).toBe('Chrome');
    expect(JSON.stringify(m)).not.toContain('155.0');
  });

  test('schema creation is idempotent and stores only session hashes',async()=>{
    const calls:string[]=[]; const sql:any=(strings:TemplateStringsArray,..._v:any[])=>{calls.push(strings.join('?'));return Promise.resolve([])};
    await ensureMonitorSchema(sql); await ensureMonitorSchema(sql);
    expect(calls.some(x=>x.includes('CREATE TABLE IF NOT EXISTS app_session_presence'))).toBe(true);
    expect(calls.some(x=>x.includes('CREATE TABLE IF NOT EXISTS app_revoked_sessions'))).toBe(true);
    expect(calls.join('\n')).not.toContain('raw_token');
  });

  test('aggregates request totals and 5xx safely',()=>{
    const before=getRuntimeMetrics();
    recordHttpResult(200,12); recordHttpResult(503,40);
    const after=getRuntimeMetrics();
    expect(after.requestTotal-before.requestTotal).toBe(2);
    expect(after.error5xx-before.error5xx).toBe(1);
    expect(after.error5xxRate).toBeGreaterThanOrEqual(0);
    expect(after.memoryRssMb).toBeGreaterThan(0);
  });
});
