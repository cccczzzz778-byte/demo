import { describe, expect, test } from 'bun:test';
import { patchProvinceMarkerHardening } from '../province-marker-hardening-patch.ts';

describe('province marker hardening patch',()=>{
  const source='<!doctype html><html><head></head><body><script>const sc={traverse(){}};const INS=[];const MT={};let __districtDrillSelected=null;</script></body></html>';
  test('injects scene-level marker visibility enforcement',()=>{
    const html=patchProvinceMarkerHardening(source);
    expect(html).toContain('BUXORO_SSB_PROVINCE_MARKER_HARDENING_V1');
    expect(html).toContain('__hardNearestInstitution');
    expect(html).toContain('__hardEnforceProvinceMarkers');
    expect(html).toContain('sc.traverse');
    expect(html).toContain('__districtDrillSelected');
  });
  test('is idempotent',()=>{
    const once=patchProvinceMarkerHardening(source);
    expect(patchProvinceMarkerHardening(once)).toBe(once);
  });
});
