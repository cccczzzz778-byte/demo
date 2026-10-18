import { describe, expect, test } from 'bun:test';
import { patchLeadershipKTMP } from './leadership-ktmp-patch.ts';

describe('leadership KTMP patch', () => {
  test('promotes existing MP records to visible KTMP type', () => {
    const src = `
const SHOWT={V:1,TTB:1,SHTB:1,OP:1,OShP:1};
const IDATA_ALL=[["Olot markaziy poliklinikasi","MP","Olot","Olot",1,2,0,null,null]];
const TY={V:["DPM",1,2,1,8,1,0],TTB:["TTB",1,2,1,9,1,1],SHTB:["SHTB",1,2,1,11,1,1],OP:["OP",1,2,1,4,1,0],OShP:["OShP",1,2,1,3,0,0]};
const TFULL={V:"DPM",TTB:"Tuman tibbiyot birlashmasi",SHTB:"Shahar tibbiyot birlashmasi",OP:"Oilaviy poliklinika",OShP:"Oilaviy shifokorlik punkti"};
const ICS={V:5.8,TTB:5.6,SHTB:6,OP:4.4,OShP:3.9},ICT={};
const dccLegend=(u)=>{const types=[['TTB','🟨'],['SHTB','🟧'],['OP','✚'],['OShP','✚']];return types};`;
    const out = patchLeadershipKTMP(src);
    expect(out).toContain('"KTMP","Olot"');
    expect(out).toMatch(/SHOWT=\{[^}]*KTMP:1/);
    expect(out).toContain('KTMP:["KTMP"');
    expect(out).toContain('KTMP:"Ko‘p tarmoqli markaziy poliklinika"');
    expect(out).toContain("['KTMP','✚']");
  });
});
