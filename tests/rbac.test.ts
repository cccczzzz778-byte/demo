import { describe, expect, test } from 'bun:test';
import { authorize, canonicalDistrict, type AccessProfile, type ResourceScope } from '../rbac.ts';

const target=(district:string|null,isDpm=false,facilityId:string|null=null):ResourceScope=>({district,isDpm,facilityId});
const profile=(p:Partial<AccessProfile>):AccessProfile=>({username:'u',role:'FACILITY',scopeType:'facility',districtId:null,facilityId:'f1',controlMode:null,active:true,...p});

describe('RBAC',()=>{
  test('keeps city and district scopes distinct',()=>{
    expect(canonicalDistrict('Buxoro tumani')).toBe('buxoro');
    expect(canonicalDistrict('Buxoro shahri')).toBe('buxoro shahri');
    expect(canonicalDistrict('Buxoro tumani')).not.toBe(canonicalDistrict('Buxoro shahri'));
    expect(canonicalDistrict('Kogon tumani')).toBe('kogon');
    expect(canonicalDistrict('Kogon shahri')).toBe('kogon shahri');
  });

  test('enforces complete permission matrix',()=>{
    const superAdmin=profile({role:'SUPER_ADMIN',scopeType:'province',facilityId:null});
    for(const action of ['VIEW','CREATE_CREDENTIAL','RESET_CREDENTIAL','SET_ACTIVE','ASSIGN_ADMIN','MANAGE_SESSION','MANAGE_HIERARCHY'] as const)
      expect(authorize(superAdmin,action,target(null,true)).allowed).toBe(true);

    const admin=profile({role:'ADMIN',scopeType:'district',districtId:'G‘ijduvon',facilityId:null});
    expect(authorize(admin,'CREATE_CREDENTIAL',target('Gijduvon')).allowed).toBe(true);
    expect(authorize(admin,'RESET_CREDENTIAL',target('Romitan')).allowed).toBe(false);
    expect(authorize(admin,'CREATE_CREDENTIAL',target('Gijduvon',true)).allowed).toBe(false);
    expect(authorize(admin,'ASSIGN_ADMIN',target('Gijduvon')).allowed).toBe(false);

    const active=profile({role:'CONTROL_ADMIN',scopeType:'province',facilityId:null,controlMode:'active'});
    expect(authorize(active,'CREATE_CREDENTIAL',target('Olot')).allowed).toBe(true);
    expect(authorize(active,'RESET_CREDENTIAL',target('Buxoro shahri')).allowed).toBe(true);
    expect(authorize(active,'CREATE_CREDENTIAL',target(null,true)).allowed).toBe(false);
    expect(authorize(active,'ASSIGN_ADMIN',target('Olot')).allowed).toBe(false);

    const viewer=profile({role:'CONTROL_ADMIN',scopeType:'province',facilityId:null,controlMode:'viewer'});
    expect(authorize(viewer,'VIEW',target(null,true)).allowed).toBe(true);
    expect(authorize(viewer,'SET_ACTIVE',target('Olot')).allowed).toBe(false);

    const district=profile({role:'CONTROL_ADMIN',scopeType:'district',districtId:'Olot',facilityId:null,controlMode:'active'});
    expect(authorize(district,'CREATE_CREDENTIAL',target('Olot')).allowed).toBe(true);
    expect(authorize(district,'CREATE_CREDENTIAL',target('Romitan')).allowed).toBe(false);

    const facility=profile({});
    expect(authorize(facility,'CREATE_CREDENTIAL',target('Olot',false,'f1')).allowed).toBe(false);
    expect(authorize({...facility,active:false},'VIEW',target('Olot',false,'f1')).allowed).toBe(false);
  });
});
