import { describe, expect, test } from 'bun:test';
import { normalizeInstitution, buildHierarchy, scopeInstitutions } from '../institution-adapter.ts';
import type { AccessProfile } from '../rbac.ts';

const rows=[
 {id:'t1',name:'Olot TTB',type:'TTB',scope:'Olot',parent_id:null},
 {id:'o1',name:'1-OP',type:'OP',scope:'Olot',parent_id:'t1'},
 {id:'s1',name:'Buxoro SHTB',type:'SHTB',scope:'Buxoro shahri',parent_id:null},
 {id:'o2',name:'2-OP',type:'OP',scope:'Buxoro shahri',parent_id:'s1'},
 {id:'orphan',name:'3-OP',type:'OP',scope:'Olot',parent_id:null},
 {id:'d1',name:'Onkologiya',type:'DPM',scope:'Buxoro shahri',parent_id:'s1'},
];
const admin:AccessProfile={username:'a',role:'ADMIN',scopeType:'district',districtId:'Olot',facilityId:null,controlMode:null,active:true};
const province:AccessProfile={username:'c',role:'CONTROL_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:'viewer',active:true};

describe('institution adapter',()=>{
 test('classifies DPM as province-level regardless legacy scope/parent',()=>{
   const d=normalizeInstitution(rows[5] as any);
   expect(d.level).toBe('province'); expect(d.district).toBeNull(); expect(d.parentId).toBeNull(); expect(d.isDpm).toBe(true);
 });
 test('builds only explicit TTB/SHTB parentage and leaves incomplete metadata unassigned',()=>{
   const h=buildHierarchy(rows as any,province);
   const olot=h.districts.find(x=>x.district==='Olot')!;
   expect(olot.centers[0].children.map(x=>x.id)).toEqual(['o1']);
   expect(olot.unassigned.map(x=>x.id)).toEqual(['orphan']);
   expect(h.dpms.map(x=>x.id)).toEqual(['d1']);
 });
 test('applies scope before any downstream filtering',()=>{
   const scoped=scopeInstitutions(rows as any,admin);
   expect(scoped.map(x=>x.id).sort()).toEqual(['o1','orphan','t1']);
   expect(scoped.some(x=>x.type==='DPM')).toBe(false);
   expect(scoped.some(x=>x.scope==='Buxoro shahri')).toBe(false);
 });
 test('keeps Buxoro city distinct from Buxoro district',()=>{
   const p={...admin,districtId:'Buxoro'};
   expect(scopeInstitutions(rows as any,p).some(x=>x.scope==='Buxoro shahri')).toBe(false);
 });
});
