import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashLegacyPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `s1$${salt}$${hash}`;
}

export function verifyLegacyPassword(password: string, encoded: string): boolean {
  try {
    const [version, salt, hex] = String(encoded).split('$');
    if (version !== 's1' || !salt || !hex) return false;
    const expected = Buffer.from(hex, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
