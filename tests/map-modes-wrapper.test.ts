import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('3D map mode wrapper integration',()=>{
  test('applies map mode / TV patch and then free camera as the final 3D navigation patch',()=>{
    const s=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain("import { patchMapModesTv } from './leadership-map-modes-patch.ts'");
    expect(s).toContain("import { patchFreeMapCamera } from './leadership-free-camera-patch.ts'");
    expect(s).toContain('patchMapModesTv(patched)');
    expect(s).toContain('patchFreeMapCamera(centeredHtml)');
  });
});
