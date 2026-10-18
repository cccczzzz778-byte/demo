import { describe, expect, test } from 'bun:test';
import { patchLeadershipKogonSplit } from './leadership-kogon-split-patch.ts';

describe('leadership Kogon district/city split', () => {
  test('separates Kogon district and Kogon city and keeps their own stats', () => {
    const src = `
const DATA=[{"n":"Kogon","c":[1,1],"r":[]},{"n":"Kogon shahri","c":[2,2],"r":[]}];
const UNIT={},UL=[],U2={};
function addU(key,title,parts){const u={key,title,parts,I:[]};UNIT[key]=u;UL.push(u);parts.forEach(p=>U2[p]=u)}
DATA.forEach(d=>{if(d.n==="Kogon"||d.n==="Kogon shahri"){if(!UNIT.Kogon)addU("Kogon","Kogon tumani va shahri",["Kogon shahri","Kogon"]);return}addU(d.n,d.n.endsWith("shahri")?d.n:d.n+" tumani",[d.n])});
const hsFind=u=>{if(!u)return HEALTH_PROVINCE;if(hsNorm(u.key)==='kogon'){const a=HEALTH_STATS.find(x=>x.key==='Kogon shahri'),b=HEALTH_STATS.find(x=>x.key==='Kogon');const sum=k=>a[k]+b[k];return{key:'Kogon tumani va shahri',pop25:sum('pop25'),pop26:sum('pop26')}};return HEALTH_STATS.find(x=>hsNorm(x.key)===hsNorm(u.key))||null};
const histKey=u=>{if(!u)return null;const n=hsNorm(u.key);if(n==='kogon')return 'Kogon combined';return Object.keys(HIST_STATS).find(k=>hsNorm(k)===n)||null};
`;
    const out = patchLeadershipKogonSplit(src);
    expect(out).toContain('addU(d.n,d.n.endsWith("shahri")?d.n:d.n+" tumani",[d.n])');
    expect(out).not.toContain('Kogon tumani va shahri');
    expect(out).not.toContain("return 'Kogon combined'");
    expect(out).toContain('{"n":"Kogon shahri","c":[1,1]');
    expect(out).toContain('{"n":"Kogon","c":[2,2]');
  });
});
