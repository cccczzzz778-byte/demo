import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('first map view with TV only',()=>{
  test('wrapper keeps old 3D scene and drops later map-mode/reposition patches',()=>{
    const s=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain("patchTvOnly");
    expect(s).not.toContain("patchMapModesTv");
    expect(s).not.toContain("patchDpmCityMap");
    expect(s).not.toContain("patchTtbKtmpCenter");
    expect(s).not.toContain("patchFreeMapCamera");
  });

  test('TV patch only adds fullscreen control and does not change map institutions or camera',()=>{
    const s=readFileSync(new URL('../leadership-tv-only-patch.ts',import.meta.url),'utf8');
    expect(s).toContain('requestFullscreen');
    expect(s).toContain('exitFullscreen');
    expect(s).toContain('TV rejim');
    expect(s).not.toContain('setMapMode');
    expect(s).not.toContain('MAIN_TYPES');
    expect(s).not.toContain('repositionDpm');
    expect(s).not.toContain('rdG=');
    expect(s).not.toContain('tgG.set');
  });
});
