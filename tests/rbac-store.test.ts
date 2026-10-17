import { describe, expect, test } from 'bun:test';
import {
  appendAdminAudit,
  bootstrapExistingAdmin,
  ensureRbacSchema,
  redactAuditDetails,
  validateAccessProfile,
  type SqlLike,
} from '../rbac-store';
import type { AccessProfile } from '../rbac';

function fakeSql() {
  const unsafeCalls: string[] = [];
  const tagCalls: { text: string; values: unknown[] }[] = [];
  const users = new Set(['admin']);
  const profiles = new Map<string, AccessProfile>();

  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?').replace(/\s+/g, ' ').trim();
    tagCalls.push({ text, values });
    if (text.includes("FROM app_access_profiles WHERE role='SUPER_ADMIN'")) {
      const p = [...profiles.values()].find(x => x.role === 'SUPER_ADMIN');
      return p ? [{ username: p.username }] : [];
    }
    if (text.includes('FROM app_users') && text.includes('lower(username)=')) {
      const username = String(values[0] ?? '').toLowerCase();
      return users.has(username) ? [{ username }] : [];
    }
    if (text.startsWith('INSERT INTO app_access_profiles')) {
      const username = String(values[0]);
      profiles.set(username, {
        username,
        role: 'SUPER_ADMIN',
        scopeType: 'province',
        districtId: null,
        facilityId: null,
        controlMode: null,
        active: true,
      });
      return [];
    }
    return [];
  }) as unknown as SqlLike;
  sql.unsafe = async (query: string) => { unsafeCalls.push(query); return []; };
  sql.json = (value: unknown) => value;
  return { sql, unsafeCalls, tagCalls, profiles };
}

const validProfiles: AccessProfile[] = [
  { username:'admin', role:'SUPER_ADMIN', scopeType:'province', districtId:null, facilityId:null, controlMode:null, active:true },
  { username:'olot-admin', role:'ADMIN', scopeType:'district', districtId:'Olot', facilityId:null, controlMode:null, active:true },
  { username:'naz', role:'CONTROL_ADMIN', scopeType:'province', districtId:null, facilityId:null, controlMode:'viewer', active:true },
  { username:'naz2', role:'CONTROL_ADMIN', scopeType:'district', districtId:'Jondor', facilityId:null, controlMode:'active', active:true },
  { username:'op1', role:'FACILITY', scopeType:'facility', districtId:'Jondor', facilityId:'f1', controlMode:null, active:true },
];

describe('RBAC persistence schema', () => {
  test('creates idempotent companion tables and a one-super-admin unique index', async () => {
    const f = fakeSql();
    await ensureRbacSchema(f.sql);
    await ensureRbacSchema(f.sql);
    const ddl = f.unsafeCalls.join('\n');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS app_access_profiles');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS app_admin_audit');
    expect(ddl).toContain('CREATE UNIQUE INDEX IF NOT EXISTS app_access_profiles_one_super_admin');
    expect(ddl).toContain("WHERE role='SUPER_ADMIN'");
    expect(ddl).not.toContain('ALTER TABLE app_users');
  });
});

describe('validateAccessProfile', () => {
  test('accepts every approved role/scope combination', () => {
    for (const p of validProfiles) expect(() => validateAccessProfile(p)).not.toThrow();
  });

  test('rejects invalid Admin and Control Admin scope/mode combinations', () => {
    expect(() => validateAccessProfile({...validProfiles[1], districtId:null})).toThrow();
    expect(() => validateAccessProfile({...validProfiles[1], scopeType:'province'})).toThrow();
    expect(() => validateAccessProfile({...validProfiles[2], controlMode:null})).toThrow();
    expect(() => validateAccessProfile({...validProfiles[3], districtId:null})).toThrow();
  });
});

describe('bootstrapExistingAdmin', () => {
  test('maps the existing legacy admin once and is idempotent without deleting users', async () => {
    const f = fakeSql();
    expect(await bootstrapExistingAdmin(f.sql, 'Admin')).toBe('created');
    expect(await bootstrapExistingAdmin(f.sql, 'Admin')).toBe('exists');
    expect(f.profiles.get('admin')?.role).toBe('SUPER_ADMIN');
    expect(f.tagCalls.some(x => /DELETE FROM app_users/i.test(x.text))).toBe(false);
  });
});

describe('audit redaction', () => {
  test('removes password, hash, token and secret values recursively', async () => {
    const input = {
      institutionId: 'f1',
      password: 'PlainSecret123!',
      nested: { passwordHash: 's1$abc', token: 'jwt-value', safe: 'ok' },
      secretKey: 'hidden',
    };
    const clean = redactAuditDetails(input);
    const serial = JSON.stringify(clean);
    expect(serial).toContain('f1');
    expect(serial).toContain('ok');
    expect(serial).not.toContain('PlainSecret123!');
    expect(serial).not.toContain('s1$abc');
    expect(serial).not.toContain('jwt-value');
    expect(serial).not.toContain('hidden');

    const f = fakeSql();
    await appendAdminAudit(f.sql, { actorUsername:'admin', action:'PASSWORD_RESET', targetId:'u1', details: input });
    const captured = JSON.stringify(f.tagCalls.at(-1)?.values ?? []);
    expect(captured).not.toContain('PlainSecret123!');
    expect(captured).not.toContain('s1$abc');
  });
});
