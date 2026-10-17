import { describe, expect, test } from 'bun:test';
import { LegacyAdminContract, normalizeLegacyActor } from '../legacy-admin-contract.ts';

describe('legacy admin contract', () => {
  test('pins current legacy admin API paths', () => {
    expect(LegacyAdminContract.me).toBe('/api/v1/me');
    expect(LegacyAdminContract.listUsers).toBe('/api/v1/admin/users');
    expect(LegacyAdminContract.createUser).toBe('/api/v1/admin/users');
    expect(LegacyAdminContract.resetUser('u1')).toBe('/api/v1/admin/users/u1/reset');
    expect(LegacyAdminContract.setUserActive('u1')).toBe('/api/v1/admin/users/u1/status');
  });

  test('normalizes current actor payload', () => {
    expect(normalizeLegacyActor({id:'1',username:'admin',role:'ADMIN',institutionId:null,scope:null})).toEqual({
      id:'1', username:'admin', role:'ADMIN', institutionId:null, scope:null,
    });
    expect(normalizeLegacyActor({username:'admin'})).toBeNull();
    expect(normalizeLegacyActor(null)).toBeNull();
  });
});
