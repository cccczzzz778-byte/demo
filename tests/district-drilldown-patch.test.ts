import { describe, expect, test } from 'bun:test';
import { patchDistrictDrilldown3d } from '../district-drilldown-patch.ts';

describe('district drilldown 3D patch',()=>{
  const source='<!doctype html><html><head></head><body><script>const INS=[];const DATA=[];const MT={};const meshes=[];const rings=[];function home(){tgG.set(0,0,0);rdG=270;phG=1;fly=true;selLab.hide=true;render("Buxoro viloyati",INS)} function selectDist(n){const t=INS.find(x=>(x.type==="TTB"||x.type==="SHTB")&&x.dist===n)||INS.find(x=>x.dist===n);if(!t)return;selLab.hide=true;tgG.set(t.pos.x,0,t.pos.z);rdG=110;phG=.9;fly=true;render(n.endsWith("shahri")?n:n+" tumani",INS.filter(x=>x.dist===n))}</script></body></html>';
  test('hides every institution scene object at province level and drills into selected district',()=>{
    const html=patchDistrictDrilldown3d(source);
    expect(html).toContain('BUXORO_SSB_DISTRICT_DRILLDOWN_3D_V3');
    expect(html).toContain('__districtDrillSelected=null');
    expect(html).toContain('__allInstitutionSceneObjects');
    expect(html).toContain("if(typeof meshes!=='undefined'&&Array.isArray(meshes))meshes.forEach");
    expect(html).toContain("if(typeof rings!=='undefined'&&Array.isArray(rings))rings.forEach");
    expect(html).toContain('__enforceDistrictVisibility');
    expect(html).toContain('setInterval(__enforceDistrictVisibility,120)');
    expect(html).toContain('__layoutDistrictInstitutions(n)');
    expect(html).toContain('__showApproxSettlements(n)');
    expect(html).toContain('rdG=__districtCameraRadius(n)');
    expect(html).toContain('__districtDrillSelected=n');
  });
  test('is idempotent',()=>{
    const once=patchDistrictDrilldown3d(source);
    expect(patchDistrictDrilldown3d(once)).toBe(once);
  });
});
