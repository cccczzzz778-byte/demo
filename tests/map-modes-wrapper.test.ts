import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('3D map mode wrapper integration',()=>{
  test('applies dedicated map mode / TV patch after performance patch',()=>{
    const s=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain("import { patchMapModesTv } from './leadership-map-modes-patch.ts'");
    expect(s).toContain('patchMapModesTv(patched)');
  });
});
