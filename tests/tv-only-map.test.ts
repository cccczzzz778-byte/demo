import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('map toolbar TV mode',()=>{
  test('wrapper uses the combined map-mode toolbar and keeps unstable camera/recenter patches disabled',()=>{
    const s=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain('patchMapModesTv');
    expect(s).toContain('patchDpmCityMap');
    expect(s).not.toContain('patchTvOnly');
    expect(s).not.toContain('patchTtbKtmpCenter');
    expect(s).not.toContain('patchFreeMapCamera');
  });

  test('combined map toolbar owns fullscreen control and the two requested map modes',()=>{
    const s=readFileSync(new URL('../leadership-map-modes-patch.ts',import.meta.url),'utf8');
    expect(s).toContain('requestFullscreen');
    expect(s).toContain('exitFullscreen');
    expect(s).toContain('TV rejim');
    expect(s).toContain('TTB / SHTB / OP / OShP xaritasi');
    expect(s).toContain('DPM xaritasi');
    expect(s).toContain("const MAIN_TYPES=new Set(['TTB','SHTB','OP','OShP'])");
  });
});
