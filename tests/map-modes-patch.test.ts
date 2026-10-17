import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { MAP_MODES_MARKER, patchMapModesTv } from '../leadership-map-modes-patch.ts';

const fixture=readFileSync(new URL('./fixtures/leadership-markers.html',import.meta.url),'utf8');

describe('leadership map modes + TV',()=>{
  test('is idempotent and injects menu / TV controls',()=>{
    const once=patchMapModesTv(fixture),twice=patchMapModesTv(once);
    expect(once).toContain(MAP_MODES_MARKER);
    expect(twice).toBe(once);
    expect(once).toContain('mapModeMenu');
    expect(once).toContain('TV rejim');
    expect(once).toContain('TTB / SHTB / OP / OShP xaritasi');
    expect(once).toContain('DPM xaritasi');
    expect(once).toContain('requestFullscreen');
    expect(once).toContain('exitFullscreen');
  });

  test('main mode shows only TTB SHTB OP OShP institutions',()=>{
    const h=patchMapModesTv(fixture);
    expect(h).toContain("const MAIN_TYPES=new Set(['TTB','SHTB','OP','OShP'])");
    expect(h).toContain("function isDpmInstitution(I)");
    expect(h).toContain("I.type==='V'||I.type==='DPM'");
    expect(h).toContain("mode==='main'?MAIN_TYPES.has(I.type):isDpmInstitution(I)");
  });

  test('DPM mode zooms to Buxoro city and distributes DPM markers around it',()=>{
    const h=patchMapModesTv(fixture);
    expect(h).toContain('function repositionDpmAcrossBukhara');
    expect(h).toContain('Buxoro shahri');
    expect(h).toContain('Math.sqrt(i+1)');
    expect(h).toContain('rdG=72');
    expect(h).toContain('phG=.82');
  });

  test('disables hierarchical flow construction and animation before page runtime',()=>{
    const source='x buildHierarchicalFlows(); y animateHierarchicalFlows(T); z';
    const h=patchMapModesTv(source);
    expect(h).not.toContain('buildHierarchicalFlows();');
    expect(h).not.toContain('animateHierarchicalFlows(T);');
    expect(h).toContain('medical data flow disabled');
  });

  test('Super Admin focusName auto-selects main or DPM mode before focusing facility',()=>{
    const h=patchMapModesTv(fixture);
    expect(h).toContain("new URLSearchParams(location.search).get('focusName')");
    expect(h).toContain("setMapMode(isDpmInstitution(target)?'dpm':'main',false)");
    expect(h).toContain('focusFacilityFromQuery');
  });
});
