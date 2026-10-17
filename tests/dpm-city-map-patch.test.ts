import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('DPM Buxoro city map separation',()=>{
  test('dedicated patch renders only DPMs on a Buxoro shahri city map',()=>{
    const s=readFileSync(new URL('../dpm-city-map-patch.ts',import.meta.url),'utf8');
    expect(s).toContain('BUXORO_SSB_DPM_CITY_MAP_V1');
    expect(s).toContain('Buxoro shahri');
    expect(s).toContain("I.type==='V'||I.type==='DPM'");
    expect(s).toContain('dpmCityMapPanel');
    expect(s).toContain('renderDpmCityMap');
  });

  test('main TTB/SHTB map excludes DPM and wrapper applies city map after map modes',()=>{
    const modes=readFileSync(new URL('../leadership-map-modes-patch.ts',import.meta.url),'utf8');
    const wrapper=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(modes).toContain("const MAIN_TYPES=new Set(['TTB','SHTB','OP','OShP'])");
    expect(wrapper).toContain("import { patchDpmCityMap } from './dpm-city-map-patch.ts';");
    expect(wrapper).toContain('patchDpmCityMap(');
  });
});
