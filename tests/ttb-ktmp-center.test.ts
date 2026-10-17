import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('TTB district-center placement',()=>{
  test('main map keeps only TTB/SHTB/OP/OShP visible while KTMP may anchor TTB placement',()=>{
    const s=readFileSync(new URL('../ttb-ktmp-center-patch.ts',import.meta.url),'utf8');
    expect(s).not.toContain("MAIN_TYPES.add('MP')");
    expect(s).not.toContain('TTB / KTMP / SHTB / OP / OShP xaritasi');
    expect(s).toContain('function snapTtbBesideKtmp');
    expect(s).toContain("I.type==='TTB'");
    expect(s).toContain("K.type==='MP'");
    expect(s).toContain('canonicalDistrictName(K.dist)===canonicalDistrictName(I.dist)');
    expect(s).toContain('moveInstitutionVisuals(I,dx,dz)');
    expect(s).toContain('moveCenteredNeighbourhood(I.name,dx,dz)');
  });
  test('wrapper applies TTB/KTMP placement patch after map modes',()=>{
    const s=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(s).toContain("import { patchTtbKtmpCenter } from './ttb-ktmp-center-patch.ts'");
    expect(s).toContain('patchTtbKtmpCenter(modeHtml)');
  });
});
