import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { patchFreeMapCamera } from '../leadership-free-camera-patch.ts';

const fixture=readFileSync(new URL('./fixtures/leadership-markers.html',import.meta.url),'utf8');

describe('free 3D map camera',()=>{
  test('adds free pan/zoom navigation without a locked center',()=>{
    const h=patchFreeMapCamera(fixture);
    expect(h).toContain('BUXORO_SSB_FREE_CAMERA_V1');
    expect(h).toContain('pointerdown');
    expect(h).toContain('pointermove');
    expect(h).toContain('wheel');
    expect(h).toContain('dblclick');
    expect(h).toContain('freePanBy');
    expect(h).toContain('freeZoomBy');
    expect(h).toContain('freePickTarget');
    expect(h).toContain("typeof auto!=='undefined'");
    expect(h).toContain("typeof fly!=='undefined'");
  });

  test('free zoom is clamped and pan updates the live target instead of snapping to a fixed center',()=>{
    const h=patchFreeMapCamera(fixture);
    expect(h).toContain('Math.max(12,Math.min(560');
    expect(h).toContain('target.x');
    expect(h).toContain('target.z');
    expect(h).toContain('const target=freeCameraTarget()');
    expect(h).not.toContain('FREE_CAMERA_FIXED_CENTER');
  });

  test('patched browser script stays valid JavaScript',()=>{
    const h=patchFreeMapCamera(fixture);
    const scripts=[...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
    expect(scripts.length).toBeGreaterThan(0);
    for(const script of scripts)expect(()=>new Function(script)).not.toThrow();
  });
});
