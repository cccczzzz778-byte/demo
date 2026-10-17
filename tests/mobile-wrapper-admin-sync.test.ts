import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('mobile wrapper admin sync',()=>{
  test('root password reseed deletes only username admin',()=>{
    const s=readFileSync(new URL('../mobile-wrapper.ts',import.meta.url),'utf8');
    expect(s).toMatch(/DELETE FROM app_users WHERE username='admin'/);
    expect(s).not.toMatch(/OR upper\(role::text\)='ADMIN'/);
  });

  test('verifies current root hash against configured password on every startup',()=>{
    const s=readFileSync(new URL('../mobile-wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain('legacyPasswordMatches');
    expect(s).toMatch(/SELECT password_hash FROM app_users WHERE username='admin'/);
    expect(s).toContain("scryptSync(password, salt, 32)");
    expect(s).toContain('timingSafeEqual');
    expect(s).not.toContain('if (!done.length)');
  });
});
