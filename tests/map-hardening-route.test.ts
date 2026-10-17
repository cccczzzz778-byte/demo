import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { patchMapPrerequisites } from '../map-prerequisites-patch.ts';

describe('map hardening integration',()=>{
  test('actual /map is hardened before leadership redesign',()=>{
    const wrapper=readFileSync(new URL('../district-ux-wrapper.ts',import.meta.url),'utf8');
    expect(wrapper).toContain("pathname === '/map'");
    expect(wrapper).toContain('patchMapPrerequisites(source)');
    expect(wrapper).toContain('patchLeadership3d(prepared)');
  });
  test('prerequisites provide polygon-safe DPM placement and SSB headquarters independently',()=>{
    const fixture='<!doctype html><head></head><body><script>const IDATA=[];\nconst TY={V:["DPM",0xb48cff,0x3a1f7a,1.5,8,1,0],TTB:["TTB",0xffc83d,0x8a5a00,1.5,9,1,1],SHTB:["SHTB",0xff7a3d,0x7a2a00,1.5,11,1,1],MP:["MP",0xff6fb5,0x6a1a40,1.1,6,1,0],OP:["OP",0x35f0a0,0x0a6a40,.9,4,1,0],OShP:["OShP",0x3fa8ff,0x0a3a7a,.8,3,0,0],SES:["SES",0xffffff,0x555555,.7,3.5,0,0],X:["Boshqa",0x9aa8ff,0x2a3a8a,1,5,1,0]};\nObject.values(gp).forEach(g=>{if(g.length>1)g.forEach((p,i)=>{const a=i*6.283/g.length;p.x+=Math.cos(a)*.8;p.z+=Math.sin(a)*.8})});\nP.forEach(p=>tower(p.I,p.x,p.y,p.z));\n// flow arcs from Buxoro SHTB to every TTB/SHTB + floating dust</script></body>';
    const h=patchMapPrerequisites(fixture);
    expect(h).toContain('function safePointInPolygon');
    expect(h).toContain('function placeDPMInsideBuxoroCity');
    expect(h).toContain('function buildSSBHeadquarters');
    expect(h).toContain('BUXORO SSB');
  });
});
