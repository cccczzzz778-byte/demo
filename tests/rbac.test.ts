import { describe, expect, test } from 'bun:test';
import { authorize, canonicalDistrict, type AccessProfile, type ResourceScope } from '../rbac';

const target = (districtId: string | null, kind: ResourceScope['kind'] = 'FACILITY', facilityId: string | null = null): ResourceScope => ({ districtId, kind, facilityId });

const superAdmin: AccessProfile = { username:'admin', role:'SUPER_ADMIN', scopeType:'province', districtId:null, facilityId:null, controlMode:null, active:true };
const districtAdmin: AccessProfile = { username:'gij-admin', role:'ADMIN', scopeType:'district', districtId:"G'ijduvon", facilityId:null, controlMode:null, active:true };
const provinceActive: AccessProfile = { username:'naz-province', role:'CONTROL_ADMIN', scopeType:'province', districtId:null, facilityId:null, controlMode:'active', active:true };
const provinceViewer: AccessProfile = { username:'naz-view', role:'CONTROL_ADMIN', scopeType:'province', districtId:null, facilityId:null, controlMode:'viewer', active:true };
const districtControl: AccessProfile = { username:'naz-bux', role:'CONTROL_ADMIN', scopeType:'district', districtId:'Buxoro', facilityId:null, controlMode:'active', active:true };
const facilityUser: AccessProfile = { username:'op1', role:'FACILITY', scopeType:'facility', districtId:'Buxoro', facilityId:'op-1', controlMode:null, active:true };

describe('canonicalDistrict', () => {
  test('normalizes spelling without collapsing city and district scopes', () => {
    expect(canonicalDistrict('Buxoro tumani')).toBe('buxoro');
    expect(canonicalDistrict('Buxoro')).toBe('buxoro');
    expect(canonicalDistrict('Buxoro shahri')).toBe('buxoro-shahri');
    expect(canonicalDistrict('Kogon tumani')).toBe('kogon');
    expect(canonicalDistrict('Kogon shahri')).toBe('kogon-shahri');
    expect(canonicalDistrict("G‘ijduvon tumani")).toBe('gijduvon');
  });
});

describe('authorize', () => {
  test('Super Admin can perform every tested action including DPM credential changes', () => {
    for (const action of ['VIEW','CREATE_CREDENTIAL','RESET_CREDENTIAL','SET_ACTIVE','ASSIGN_ADMIN','MANAGE_SESSION','MANAGE_HIERARCHY'] as const) {
      expect(authorize(superAdmin, action, target(null, action === 'CREATE_CREDENTIAL' ? 'DPM' : 'FACILITY')).allowed).toBe(true);
    }
  });

  test('ordinary Admin can manage credentials only inside its one district and cannot access DPM at all', () => {
    expect(authorize(districtAdmin,'CREATE_CREDENTIAL',target("G'ijduvon")).allowed).toBe(true);
    expect(authorize(districtAdmin,'RESET_CREDENTIAL',target("G‘ijduvon tumani")).allowed).toBe(true);
    expect(authorize(districtAdmin,'SET_ACTIVE',target('Jondor')).allowed).toBe(false);
    expect(authorize(districtAdmin,'CREATE_CREDENTIAL',target("G'ijduvon",'DPM')).allowed).toBe(false);
    expect(authorize(districtAdmin,'VIEW',target("G'ijduvon",'DPM')).allowed).toBe(false);
    expect(authorize(districtAdmin,'ASSIGN_ADMIN',target("G'ijduvon")).allowed).toBe(false);
  });

  test('province active Control Admin manages non-DPM district credentials, may monitor DPM, but cannot change DPM credentials or admins', () => {
    expect(authorize(provinceActive,'CREATE_CREDENTIAL',target('Olot')).allowed).toBe(true);
    expect(authorize(provinceActive,'RESET_CREDENTIAL',target('Buxoro shahri')).allowed).toBe(true);
    expect(authorize(provinceActive,'VIEW',target(null,'DPM')).allowed).toBe(true);
    expect(authorize(provinceActive,'CREATE_CREDENTIAL',target(null,'DPM')).allowed).toBe(false);
    expect(authorize(provinceActive,'ASSIGN_ADMIN',target('Olot')).allowed).toBe(false);
  });

  test('viewer Control Admin is read-only even at province scope and may view DPM', () => {
    expect(authorize(provinceViewer,'VIEW',target(null,'DPM')).allowed).toBe(true);
    expect(authorize(provinceViewer,'RESET_CREDENTIAL',target('Olot')).allowed).toBe(false);
    expect(authorize(provinceViewer,'SET_ACTIVE',target('Olot')).allowed).toBe(false);
  });

  test('district Control Admin cannot escape to city alias, another district, or province DPM', () => {
    expect(authorize(districtControl,'CREATE_CREDENTIAL',target('Buxoro tumani')).allowed).toBe(true);
    expect(authorize(districtControl,'CREATE_CREDENTIAL',target('Buxoro shahri')).allowed).toBe(false);
    expect(authorize(districtControl,'CREATE_CREDENTIAL',target('Kogon')).allowed).toBe(false);
    expect(authorize(districtControl,'VIEW',target('Buxoro','DPM')).allowed).toBe(false);
  });

  test('facility user can only view its own facility and cannot manage credentials', () => {
    expect(authorize(facilityUser,'VIEW',target('Buxoro','FACILITY','op-1')).allowed).toBe(true);
    expect(authorize(facilityUser,'VIEW',target('Buxoro','FACILITY','op-2')).allowed).toBe(false);
    expect(authorize(facilityUser,'CREATE_CREDENTIAL',target('Buxoro','FACILITY','op-1')).allowed).toBe(false);
  });

  test('inactive profiles are denied before any role rule', () => {
    expect(authorize({...superAdmin,active:false},'VIEW',target(null,'DPM')).allowed).toBe(false);
  });
});
