import { describe, expect, test } from 'bun:test';
import { LegacyAdminContract, normalizeLegacyActor } from '../legacy-admin-contract';

describe('legacy admin API contract', () => {
  test('pins the current authenticated user and admin-user endpoints', () => {
    expect(LegacyAdminContract.me).toBe('/api/v1/me');
    expect(LegacyAdminContract.listUsers).toBe('/api/v1/admin/users');
    expect(LegacyAdminContract.createUser).toBe('/api/v1/admin/users');
    expect(LegacyAdminContract.resetUser('user-1')).toBe('/api/v1/admin/users/user-1/reset');
    expect(LegacyAdminContract.setUserActive('user-1')).toBe('/api/v1/admin/users/user-1/status');
  });

  test('normalizes only a valid legacy actor payload', () => {
    expect(normalizeLegacyActor(null)).toBeNull();
    expect(normalizeLegacyActor({ username: 'admin' })).toBeNull();
    expect(normalizeLegacyActor({ id: 'u1', username: '', role: 'ADMIN' })).toBeNull();
    expect(normalizeLegacyActor({
      id: 'u1',
      username: 'admin',
      role: 'ADMIN',
      institutionId: null,
      scope: null,
    })).toEqual({
      id: 'u1',
      username: 'admin',
      role: 'ADMIN',
      institutionId: null,
      scope: null,
    });
  });
});
