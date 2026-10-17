import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('Super Admin CSP styling',()=>{
  test('inline admin style uses the runtime CSP nonce placeholder',()=>{
    const s=readFileSync(new URL('../super-admin-ui.ts',import.meta.url),'utf8');
    expect(s).toContain('<style nonce="__CSP_NONCE__">');
  });
});
