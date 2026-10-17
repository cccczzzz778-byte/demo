import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('3D wrapper integration',()=>{
  test('enables stable map modes and DPM city map without old unstable camera/recenter patches',()=>{
    const s=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain("import { patchMapModesTv } from './leadership-map-modes-patch.ts'");
    expect(s).toContain("import { patchDpmCityMap } from './dpm-city-map-patch.ts'");
    expect(s).toContain("import { patchOriginalMapColors } from './leadership-original-colors-patch.ts'");
    expect(s).toContain('patchMapModesTv(');
    expect(s).toContain('patchDpmCityMap(');
    expect(s).toContain('patchOriginalMapColors(');
    expect(s).not.toContain('patchFreeMapCamera');
    expect(s).not.toContain('patchTtbKtmpCenter');
    expect(s).not.toContain('patchTvOnly');
  });
});
