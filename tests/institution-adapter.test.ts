import { describe, expect, test } from 'bun:test';
import {
  buildInstitutionHierarchy,
  filterInstitutionsForProfile,
  institutionLevel,
  type InstitutionRecord,
} from '../institution-adapter';
import type { AccessProfile } from '../rbac';

const superAdmin:AccessProfile={username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:null,active:true};
const provinceViewer:AccessProfile={username:'naz',role:'CONTROL_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:'viewer',active:true};
const buxDistrict:AccessProfile={username:'bux',role:'ADMIN',scopeType:'district',districtId:'Buxoro',facilityId:null,controlMode:null,active:true};
const buxCity:AccessProfile={username:'bux-city',role:'ADMIN',scopeType:'district',districtId:'Buxoro shahri',facilityId:null,controlMode:null,active:true};

const rows:InstitutionRecord[]=[
  {id:'ssb',name:'Buxoro SSB',type:'SSB',scope:'Buxoro shahri',parentId:null},
  {id:'dpm',name:'Viloyat DPM',type:'DPM',scope:'Buxoro shahri',parentId:null},
  {id:'ttb-bux',name:'Buxoro TTB',type:'TTB',scope:'Buxoro',parentId:null},
  {id:'op-bux',name:'Buxoro OP',type:'OP',scope:'Buxoro tumani',parentId:'ttb-bux'},
  {id:'shtb-bux',name:'Buxoro SHTB',type:'SHTB',scope:'Buxoro shahri',parentId:null},
  {id:'op-city',name:'Buxoro shahar OP',type:'OP',scope:'Buxoro shahri',parentId:'shtb-bux'},
  {id:'ttb-jondor',name:'Jondor TTB',type:'TTB',scope:'Jondor',parentId:null},
  {id:'oshp-jondor',name:'Jondor OShP',type:'OSHP',scope:'Jondor tumani',parentId:'ttb-jondor'},
  {id:'broken',name:'Scope yo‘q OP',type:'OP',scope:null,parentId:null},
];

describe('institution level classification',()=>{
  test('keeps DPM and SSB at province level regardless of city-looking scope',()=>{
    expect(institutionLevel(rows[0])).toBe('province');
    expect(institutionLevel(rows[1])).toBe('province');
    expect(institutionLevel(rows[2])).toBe('district');
  });
});

describe('scope filtering',()=>{
  test('district and city are distinct while tumani aliases normalize',()=>{
    expect(filterInstitutionsForProfile(buxDistrict,rows).map(x=>x.id).sort()).toEqual(['op-bux','ttb-bux'].sort());
    expect(filterInstitutionsForProfile(buxCity,rows).map(x=>x.id).sort()).toEqual(['op-city','shtb-bux'].sort());
  });

  test('province viewer can monitor DPM/SSB and all scoped districts but not malformed unscoped facility rows',()=>{
    const ids=filterInstitutionsForProfile(provinceViewer,rows).map(x=>x.id);
    expect(ids).toContain('dpm');
    expect(ids).toContain('ssb');
    expect(ids).toContain('ttb-jondor');
    expect(ids).not.toContain('broken');
  });

  test('Super Admin can see malformed rows so hierarchy can be repaired',()=>{
    expect(filterInstitutionsForProfile(superAdmin,rows).map(x=>x.id)).toContain('broken');
  });
});

describe('hierarchy',()=>{
  test('builds province nodes and TTB/SHTB -> OP/OShP children without mixing Buxoro city and district',()=>{
    const h=buildInstitutionHierarchy(superAdmin,rows);
    expect(h.province.map(x=>x.id).sort()).toEqual(['dpm','ssb']);
    expect(h.unassigned.map(x=>x.id)).toEqual(['broken']);
    const bux=h.districts.find(x=>x.key==='buxoro');
    const city=h.districts.find(x=>x.key==='buxoro-shahri');
    expect(bux?.centers.find(x=>x.id==='ttb-bux')?.children.map(x=>x.id)).toEqual(['op-bux']);
    expect(city?.centers.find(x=>x.id==='shtb-bux')?.children.map(x=>x.id)).toEqual(['op-city']);
    expect(bux?.centers.some(x=>x.id==='shtb-bux')).toBe(false);
  });
});
