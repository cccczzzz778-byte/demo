import { describe, expect, test } from 'bun:test';
import { patchScoped3dCard } from '../district-facility-3d-card-patch.ts';

describe('district/facility 3D card UX',()=>{
  const source='<!doctype html><html><head></head><body><main><h1>G‘ijduvon SSB</h1><iframe class="map" src="/leadership"></iframe></main></body></html>';

  test('adds premium scoped 3D card styling and controls',()=>{
    const h=patchScoped3dCard(source,'/facility');
    expect(h).toContain('BUXORO_SCOPE_3D_CARD_V1');
    expect(h).toContain('scope3d-card');
    expect(h).toContain('3D xarita');
    expect(h).toContain('To‘liq ekran');
  });

  test('is idempotent and leaves leadership page alone',()=>{
    const h=patchScoped3dCard(source,'/facility');
    expect(patchScoped3dCard(h,'/facility')).toBe(h);
    expect(patchScoped3dCard(source,'/leadership')).toBe(source);
  });

  test('keeps map source untouched',()=>{
    const h=patchScoped3dCard(source,'/district');
    expect(h).toContain('src="/leadership"');
  });
});
