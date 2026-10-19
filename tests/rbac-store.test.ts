import { describe, expect, test } from 'bun:test';
import { validateAccessProfile, redactAuditDetails, ensureRbacSchema } from '../rbac-store.ts';

const base={username:'x',role:'ADMIN',scopeType:'district',districtId:'Olot',facilityId:null,controlMode:null,active:true} as const;

describe('RBAC store',()=>{
  test('validates role/scope invariants',()=>{
    expect(validateAccessProfile(base).ok).toBe(true);
    expect(validateAccessProfile({...base,districtId:null}).ok).toBe(false);
    expect(validateAccessProfile({...base,role:'CONTROL_ADMIN',scopeType:'province',districtId:null,controlMode:'viewer'}).ok).toBe(true);
    expect(validateAccessProfile({...base,role:'CONTROL_ADMIN',scopeType:'district',districtId:'Olot',controlMode:null}).ok).toBe(false);
    expect(validateAccessProfile({...base,role:'SUPER_ADMIN',scopeType:'district'}).ok).toBe(false);
    expect(validateAccessProfile({username:'op1',role:'FACILITY',scopeType:'facility',districtId:null,facilityId:'olot-op',controlMode:null,active:true}).ok).toBe(true);
    expect(validateAccessProfile({username:'op1',role:'FACILITY',scopeType:'facility',districtId:null,facilityId:null,controlMode:null,active:true}).ok).toBe(false);
  });

  test('redacts secrets recursively',()=>{
    expect(redactAuditDetails({password:'x',nested:{password_hash:'abc',token:'t',safe:1},username:'u'})).toEqual({password:'[REDACTED]',nested:{password_hash:'[REDACTED]',token:'[REDACTED]',safe:1},username:'u'});
  });

  test('schema is idempotent and migrates old constraints for FACILITY scope',async()=>{
    const calls:string[]=[];
    const sql:any=(strings:TemplateStringsArray,..._values:any[])=>{calls.push(strings.join('?'));return Promise.resolve([])};
    await ensureRbacSchema(sql); await ensureRbacSchema(sql);
    expect(calls.some(x=>x.includes('CREATE TABLE IF NOT EXISTS app_access_profiles'))).toBe(true);
    expect(calls.some(x=>x.includes('DROP CONSTRAINT IF EXISTS app_access_profiles_role_check'))).toBe(true);
    expect(calls.some(x=>x.includes('app_access_profiles_role_check_v2'))).toBe(true);
    expect(calls.some(x=>x.includes("'FACILITY'"))).toBe(true);
    expect(calls.some(x=>x.includes("'facility'"))).toBe(true);
    expect(calls.some(x=>x.includes('CREATE UNIQUE INDEX IF NOT EXISTS app_one_super_admin_idx'))).toBe(true);
    expect(calls.some(x=>x.includes("WHERE role='SUPER_ADMIN'"))).toBe(true);
    expect(calls.some(x=>x.includes('CREATE TABLE IF NOT EXISTS app_admin_audit'))).toBe(true);
  });
});
