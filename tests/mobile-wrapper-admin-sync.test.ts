import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('mobile wrapper admin sync',()=>{
  test('root password reseed deletes only username admin',()=>{
    const s=readFileSync(new URL('../mobile-wrapper.ts',import.meta.url),'utf8');
    expect(s).toMatch(/DELETE FROM app_users WHERE username='admin'/);
    expect(s).not.toMatch(/OR upper\(role::text\)='ADMIN'/);
  });
});
