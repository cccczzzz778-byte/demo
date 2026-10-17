import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('wrapper chain',()=>{
  test('outer wrapper owns control API, blocks legacy user-management bypass, and preserves wrapper chain',()=>{
    const s=readFileSync(new URL('../super-admin-wrapper.ts',import.meta.url),'utf8');
    expect(s).toMatch(/handleAdminApi\(request, innerFetch, deps\)/);
    expect(s).toMatch(/\(\?:admin\|region\)\\\/users/);
    expect(s).toMatch(/await import\('\.\/district-ux-wrapper\.ts'\)/);
    expect(s).toMatch(/ensureRbacSchema/);
    expect(s).toMatch(/bootstrapSuperAdmin/);
  });
});
