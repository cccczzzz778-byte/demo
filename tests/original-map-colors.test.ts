import { describe, expect, test } from 'bun:test';
import { patchOriginalMapColors, ORIGINAL_COLORS_MARKER } from '../leadership-original-colors-patch.ts';

describe('original 3D map colors',()=>{
  test('restores the first map surface and ribbon colors and stays idempotent',()=>{
    const source='<html><head></head><body><script>const col=new THREE.Color(DISTRICT_COLORS[d.n]||0x88b7e8);ribbon(lp,h,city?5:3.2,districtStatusColor(d.n));</script></body></html>';
    const once=patchOriginalMapColors(source);
    const twice=patchOriginalMapColors(once);
    expect(once).toContain(ORIGINAL_COLORS_MARKER);
    expect(once).toContain('const col=city?new THREE.Color(0x8aeeff):c1.clone().lerp(c2,(VAL[d.n]-35)/60);');
    expect(once).toContain('ribbon(lp,h,city?5:3.2,city?0xffffff:0x27d8ff);');
    expect(twice).toBe(once);
  });
});
