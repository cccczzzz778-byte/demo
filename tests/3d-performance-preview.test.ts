import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { patch3dPerformanceAndFacilityFocus } from '../leadership-performance-patch.ts';

describe('3D performance and facility focus',()=>{
  test('removes animated medical-data flow and caps rendered neighbourhood instances',()=>{
    const src='<html><body><script>const flowObjects=[];const pulses=[];const neighbourhoodObjects=[];const INS=[];function selectInst(I){}</script></body></html>';
    const out=patch3dPerformanceAndFacilityFocus(src);
    expect(out).toContain('BUXORO_SSB_3D_PERF_V1');
    expect(out).toContain('removeMedicalDataFlow');
    expect(out).toContain('flowObjects.length=0');
    expect(out).toContain('pulses.length=0');
    expect(out).toContain('o.count=Math.min(o.count');
  });

  test('focuses /map on the institution name supplied by Super Admin preview',()=>{
    const src='<html><body><script>const flowObjects=[];const pulses=[];const neighbourhoodObjects=[];const INS=[];function selectInst(I){}</script></body></html>';
    const out=patch3dPerformanceAndFacilityFocus(src);
    expect(out).toContain("get('focusName')");
    expect(out).toContain('selectInst(target)');
    const actions=readFileSync(new URL('../super-admin-ui-actions.ts',import.meta.url),'utf8');
    expect(actions).toContain('/map?focusName=');
    expect(actions).toContain('<iframe class="map"');
  });
});
