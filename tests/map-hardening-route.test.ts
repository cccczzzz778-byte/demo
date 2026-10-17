import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('map hardening integration',()=>{
  test('applies patchLeadershipHtml to both leadership shell and actual /map Three.js response',()=>{
    const s=readFileSync(new URL('../wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain("url.pathname === '/leadership' || url.pathname === '/map'");
    expect(s).toContain('body = patchLeadershipHtml(await response.text())');
  });
});
