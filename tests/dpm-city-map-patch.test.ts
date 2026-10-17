import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { patchDpmCityMap } from '../dpm-city-map-patch.ts';

describe('DPM Buxoro city map separation',()=>{
  test('dedicated patch implementation remains available for future use',()=>{
    const s=readFileSync(new URL('../dpm-city-map-patch.ts',import.meta.url),'utf8');
    expect(s).toContain('BUXORO_SSB_DPM_CITY_MAP_V1');
    expect(s).toContain('Buxoro shahri');
    expect(s).toContain("I.type==='V'||I.type==='DPM'");
    expect(s).toContain('dpmCityMapPanel');
    expect(s).toContain('renderDpmCityMap');
  });

  test('restored first-view wrapper does not apply the dedicated DPM city map',()=>{
    const wrapper=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(wrapper).not.toContain('patchDpmCityMap');
    expect(wrapper).not.toContain('dpm-city-map-patch.ts');
  });

  test('patch itself stays idempotent and parseable',()=>{
    const base='<!doctype html><html><head></head><body><script nonce="abc">function setMapMode(){};const INS=[];</script></body></html>';
    const once=patchDpmCityMap(base),twice=patchDpmCityMap(once);
    expect(twice).toBe(once);
    expect((once.match(/BUXORO_SSB_DPM_CITY_MAP_V1/g)||[]).length).toBeGreaterThan(0);
    const scripts=[...once.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
    expect(scripts.length).toBeGreaterThan(0);
    scripts.forEach(code=>expect(()=>new Function(code)).not.toThrow());
  });
});
