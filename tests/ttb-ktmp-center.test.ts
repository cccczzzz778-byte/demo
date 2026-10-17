import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('TTB district-center placement',()=>{
  test('main map keeps KTMP/MP visible and snaps each TTB beside same-district KTMP',()=>{
    const s=readFileSync(new URL('../leadership-map-modes-patch.ts',import.meta.url),'utf8');
    expect(s).toContain("new Set(['TTB','SHTB','MP','OP','OShP'])");
    expect(s).toContain('function snapTtbBesideKtmp');
    expect(s).toContain("I.type==='TTB'");
    expect(s).toContain("K.type==='MP'");
    expect(s).toContain('canonicalDistrictName(K.dist)===canonicalDistrictName(I.dist)');
    expect(s).toContain('moveInstitutionVisuals(I,dx,dz)');
    expect(s).toContain('moveCenteredNeighbourhood(I.name,dx,dz)');
  });
});
