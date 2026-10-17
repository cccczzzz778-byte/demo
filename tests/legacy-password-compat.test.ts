import { describe, expect, test } from 'bun:test';
import { hashLegacyPassword, verifyLegacyPassword } from '../legacy-password-compat';

describe('legacy password compatibility', () => {
  test('uses the base app s1$salt$hash scrypt format', () => {
    const encoded = hashLegacyPassword('Asad_4777');
    expect(encoded).toMatch(/^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    expect(verifyLegacyPassword('Asad_4777', encoded)).toBe(true);
    expect(verifyLegacyPassword('wrong-password', encoded)).toBe(false);
  });
});
