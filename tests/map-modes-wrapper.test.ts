import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('3D wrapper integration',()=>{
  test('keeps TV fullscreen control while later map-mode navigation patches stay inactive',()=>{
    const s=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain("import { patchTvOnly } from './leadership-tv-only-patch.ts'");
    expect(s).toContain('patchTvOnly(optimized)');
    expect(s).not.toContain('patchMapModesTv');
    expect(s).not.toContain('patchFreeMapCamera');
    expect(s).not.toContain('patchDpmCityMap');
    expect(s).not.toContain('patchTtbKtmpCenter');
  });
});
