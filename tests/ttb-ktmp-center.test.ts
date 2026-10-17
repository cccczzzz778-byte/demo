import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

describe('TTB district-center placement',()=>{
  test('legacy placement patch remains available but is not active in restored first view',()=>{
    const s=readFileSync(new URL('../ttb-ktmp-center-patch.ts',import.meta.url),'utf8');
    expect(s).toContain('function snapTtbBesideKtmp');
    expect(s).toContain("I.type==='TTB'");
    expect(s).toContain("K.type==='MP'");
    expect(s).toContain('moveInstitutionVisuals(I,dx,dz)');
  });
  test('wrapper no longer repositions TTB beside KTMP',()=>{
    const s=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(s).not.toContain('patchTtbKtmpCenter');
    expect(s).not.toContain('ttb-ktmp-center-patch.ts');
  });
});
