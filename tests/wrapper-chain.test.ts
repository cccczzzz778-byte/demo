import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { createSecurityGateRequest, withSecurityHeaders } from '../super-admin-wrapper-core';
import { isAdminManagedRequest } from '../super-admin-api';

const read = (p:string) => readFileSync(new URL('../'+p, import.meta.url),'utf8');

describe('managed request detection', () => {
  test('covers control, legacy admin and region credential mutations only', () => {
    expect(isAdminManagedRequest(new Request('https://x/api/control/users'))).toBe(true);
    expect(isAdminManagedRequest(new Request('https://x/api/v1/admin/users',{method:'POST'}))).toBe(true);
    expect(isAdminManagedRequest(new Request('https://x/api/v1/region/users',{method:'POST'}))).toBe(true);
    expect(isAdminManagedRequest(new Request('https://x/api/v1/region/summary'))).toBe(false);
    expect(isAdminManagedRequest(new Request('https://x/api/v1/facility'))).toBe(false);
  });
});

describe('security gate', () => {
  test('probes the existing inner security wrapper without executing the real managed mutation', async () => {
    const req=new Request('https://public.example/api/control/credentials',{method:'POST',headers:{origin:'https://public.example','content-type':'application/json','x-test':'1'},body:JSON.stringify({password:'secret'})});
    const gate=await createSecurityGateRequest(req);
    expect(new URL(gate.url).pathname).toBe('/api/admin/users/__rbac_security_gate__');
    expect(gate.method).toBe('POST');
    expect(gate.headers.get('origin')).toBe('https://public.example');
    expect(await gate.json()).toEqual({password:'secret'});
  });

  test('copies security headers but preserves managed response content type/status', () => {
    const managed=new Response(JSON.stringify({ok:true}),{status:201,headers:{'content-type':'application/json'}});
    const gate=new Response('not found',{status:404,headers:{
      'strict-transport-security':'max-age=63072000; includeSubDomains',
      'content-security-policy':"default-src 'self'",
      'x-frame-options':'DENY',
      'x-content-type-options':'nosniff',
      'referrer-policy':'no-referrer',
      'permissions-policy':'camera=()',
      'cross-origin-opener-policy':'same-origin',
      'cross-origin-resource-policy':'same-origin',
      'content-type':'text/plain',
    }});
    const out=withSecurityHeaders(managed,gate);
    expect(out.status).toBe(201);
    expect(out.headers.get('content-type')).toContain('application/json');
    expect(out.headers.get('strict-transport-security')).toContain('63072000');
    expect(out.headers.get('x-frame-options')).toBe('DENY');
  });
});

describe('wrapper import chain and scripts', () => {
  test('keeps security/mobile/3D wrappers and starts from the new RBAC wrapper', () => {
    expect(read('super-admin-wrapper.ts')).toContain("await import('./district-ux-wrapper.ts')");
    expect(read('district-ux-wrapper.ts')).toContain("await import('./mobile-wrapper.ts')");
    expect(read('mobile-wrapper.ts')).toContain("await import('./wrapper.ts')");
    expect(read('wrapper.ts')).toContain("await import('./index.ts')");
    const pkg=JSON.parse(read('package.json'));
    expect(pkg.scripts.start).toBe('bun super-admin-wrapper.ts');
    expect(pkg.scripts.test).toBe('bun test');
    expect(pkg.packageManager).toBe('bun@1.2.23');
    expect(pkg.dependencies.postgres).toBe('^3.4.7');
  });
});
