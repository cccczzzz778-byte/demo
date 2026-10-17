import { randomUUID } from 'node:crypto';
import { LegacyAdminContract, normalizeLegacyActor, type LegacyActor } from './legacy-admin-contract';
import { hashLegacyPassword } from './legacy-password-compat';
import { authorize, type AccessProfile, type ResourceScope } from './rbac';
import {
  appendAdminAudit,
  getProfile,
  listAdminProfiles,
  normalizeUsername,
  setProfileActive,
  upsertAdminProfile,
  validateAccessProfile,
  type AdminAuditEvent,
  type SqlLike,
} from './rbac-store';

export type ManagedInstitution = {
  id: string;
  name: string;
  type: string;
  scope: string | null;
  parentId: string | null;
};

export type ManagedUser = {
  id: string;
  username: string;
  role: string;
  active: boolean;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  scope: string | null;
};

export type ResolvedActor = { actor: LegacyActor; profile: AccessProfile };

export type CreateManagedAdminInput = {
  username: string;
  password: string;
  role: 'ADMIN' | 'CONTROL_ADMIN';
  scopeType: 'province' | 'district';
  districtId: string | null;
  controlMode: 'active' | 'viewer' | null;
};

export type AdminApiDeps = {
  resolveActor(request: Request, innerFetch: (request: Request) => Promise<Response>): Promise<ResolvedActor | null>;
  findInstitution(id: string): Promise<ManagedInstitution | null>;
  findUser(id: string): Promise<ManagedUser | null>;
  listInstitutions(): Promise<ManagedInstitution[]>;
  listUsers(): Promise<ManagedUser[]>;
  listAdmins(): Promise<AccessProfile[]>;
  createManagedAdmin(input: CreateManagedAdminInput, actorUsername: string): Promise<unknown>;
  resetManagedAdmin(username: string, password: string, actorUsername: string): Promise<boolean>;
  setManagedAdminActive(username: string, active: boolean, actorUsername: string): Promise<boolean>;
  audit(event: AdminAuditEvent): Promise<void>;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

async function readJson(request: Request): Promise<Record<string, any>> {
  try {
    const value = await request.clone().json();
    return value && typeof value === 'object' ? value as Record<string, any> : {};
  } catch {
    return {};
  }
}

function resourceForInstitution(inst: ManagedInstitution): ResourceScope {
  const protectedProvince = inst.type === 'DPM' || inst.type === 'SSB';
  return { kind: protectedProvince ? 'DPM' : 'FACILITY', districtId: inst.scope, facilityId: inst.id };
}

function resourceForUser(user: ManagedUser): ResourceScope {
  const protectedProvince = user.institutionType === 'DPM' || user.institutionType === 'SSB';
  return { kind: protectedProvince ? 'DPM' : 'FACILITY', districtId: user.scope, facilityId: user.institutionId };
}

function expectedLegacyRole(type: string): string | null {
  if (type === 'SSB') return 'LEADERSHIP';
  if (type === 'TTB' || type === 'SHTB') return 'TTB_SHTB';
  if (type === 'DPM' || type === 'OP' || type === 'OSHP') return 'DATA_ENTRY';
  return null;
}

function requestForInner(original: Request, path: string, body?: unknown): Request {
  const url = new URL(path, original.url);
  const headers = new Headers(original.headers);
  headers.set('content-type', 'application/json');
  headers.delete('content-length');
  return new Request(url, {
    method: original.method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function isRegionCredentialMutation(path: string, method: string): boolean {
  if (method !== 'POST') return false;
  return path === '/api/v1/region/users' || /^\/api\/v1\/region\/users\/[^/]+\/reset$/.test(path);
}

function isLegacyAdminUsers(path: string): boolean {
  return path === '/api/v1/admin/users' || /^\/api\/v1\/admin\/users\/[^/]+\/(reset|status)$/.test(path);
}

async function requireResolved(request: Request, innerFetch: (request: Request) => Promise<Response>, deps: AdminApiDeps): Promise<ResolvedActor | Response> {
  const resolved = await deps.resolveActor(request, innerFetch);
  return resolved ?? json({ error: 'Unauthorized' }, 401);
}

async function createCredential(request: Request, innerFetch: (request: Request) => Promise<Response>, deps: AdminApiDeps, resolved: ResolvedActor): Promise<Response> {
  const body = await readJson(request);
  const institutionId = String(body.institutionId || '');
  const inst = institutionId ? await deps.findInstitution(institutionId) : null;
  if (!inst) return json({ error: 'Muassasa topilmadi' }, 404);
  const decision = authorize(resolved.profile, 'CREATE_CREDENTIAL', resourceForInstitution(inst));
  if (!decision.allowed) return json({ error: 'Forbidden', reason: decision.reason }, 403);
  const role = expectedLegacyRole(inst.type);
  if (!role) return json({ error: 'Bu muassasa turiga login berilmaydi' }, 400);
  const payload = {
    institutionId: inst.id,
    role,
    username: String(body.username || '').trim().toLowerCase(),
    password: String(body.password || ''),
  };
  const response = await innerFetch(requestForInner(request, LegacyAdminContract.createUser, payload));
  if (response.ok) await deps.audit({ actorUsername: resolved.profile.username, action: 'CREDENTIAL_CREATE', targetId: inst.id, details: { institutionId: inst.id, username: payload.username, role } });
  return response;
}

async function mutateCredential(request: Request, innerFetch: (request: Request) => Promise<Response>, deps: AdminApiDeps, resolved: ResolvedActor, userId: string, action: 'reset' | 'status'): Promise<Response> {
  const target = await deps.findUser(userId);
  if (!target) return json({ error: 'Topilmadi' }, 404);
  const rbacAction = action === 'reset' ? 'RESET_CREDENTIAL' : 'SET_ACTIVE';
  const decision = authorize(resolved.profile, rbacAction, resourceForUser(target));
  if (!decision.allowed) return json({ error: 'Forbidden', reason: decision.reason }, 403);
  const body = await readJson(request);
  const path = action === 'reset' ? LegacyAdminContract.resetUser(userId) : LegacyAdminContract.setUserActive(userId);
  const payload = action === 'reset' ? { password: String(body.password || '') } : { active: !!body.active };
  const response = await innerFetch(requestForInner(request, path, payload));
  if (response.ok) await deps.audit({ actorUsername: resolved.profile.username, action: action === 'reset' ? 'CREDENTIAL_RESET' : 'CREDENTIAL_STATUS', targetId: userId, details: action === 'status' ? { active: !!body.active } : {} });
  return response;
}

function profileCanView(profile: AccessProfile, resource: ResourceScope): boolean {
  return authorize(profile, 'VIEW', resource).allowed;
}

export async function handleAdminApi(
  request: Request,
  innerFetch: (request: Request) => Promise<Response>,
  deps: AdminApiDeps,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const handled = path.startsWith('/api/control/') || isLegacyAdminUsers(path) || isRegionCredentialMutation(path, method);
  if (!handled) return null;

  const auth = await requireResolved(request, innerFetch, deps);
  if (auth instanceof Response) return auth;
  const resolved = auth;

  if (isRegionCredentialMutation(path, method)) {
    return json({ error: 'Login/parolni faqat tayinlangan hudud admini beradi' }, 403);
  }

  if (path === '/api/control/me' && method === 'GET') {
    return json({ actor: resolved.actor, profile: resolved.profile });
  }

  if ((path === '/api/control/institutions') && method === 'GET') {
    const items = (await deps.listInstitutions()).filter(inst => profileCanView(resolved.profile, resourceForInstitution(inst)));
    return json({ institutions: items });
  }

  if ((path === '/api/control/users' || (path === LegacyAdminContract.listUsers && method === 'GET')) && method === 'GET') {
    const items = (await deps.listUsers()).filter(user => profileCanView(resolved.profile, resourceForUser(user)));
    return json({ users: items });
  }

  if ((path === '/api/control/credentials' || path === LegacyAdminContract.createUser) && method === 'POST') {
    return createCredential(request, innerFetch, deps, resolved);
  }

  let match = path.match(/^\/api\/control\/users\/([^/]+)\/(reset|status)$/);
  if (!match) match = path.match(/^\/api\/v1\/admin\/users\/([^/]+)\/(reset|status)$/);
  if (match && method === 'POST') {
    return mutateCredential(request, innerFetch, deps, resolved, decodeURIComponent(match[1]), match[2] as 'reset' | 'status');
  }

  if (path === '/api/control/admins' && method === 'GET') {
    const decision = authorize(resolved.profile, 'ASSIGN_ADMIN', { kind:'ADMIN_PROFILE', districtId:null, facilityId:null });
    if (!decision.allowed) return json({ error:'Forbidden', reason:decision.reason }, 403);
    return json({ admins: await deps.listAdmins() });
  }

  if (path === '/api/control/admins' && method === 'POST') {
    const decision = authorize(resolved.profile, 'ASSIGN_ADMIN', { kind:'ADMIN_PROFILE', districtId:null, facilityId:null });
    if (!decision.allowed) return json({ error:'Forbidden', reason:decision.reason }, 403);
    const body = await readJson(request);
    const input: CreateManagedAdminInput = {
      username: String(body.username || '').trim().toLowerCase(),
      password: String(body.password || ''),
      role: body.role === 'CONTROL_ADMIN' ? 'CONTROL_ADMIN' : 'ADMIN',
      scopeType: body.scopeType === 'province' ? 'province' : 'district',
      districtId: body.districtId == null || body.districtId === '' ? null : String(body.districtId),
      controlMode: body.role === 'CONTROL_ADMIN' ? (body.controlMode === 'viewer' ? 'viewer' : 'active') : null,
    };
    try {
      const created = await deps.createManagedAdmin(input, resolved.profile.username);
      return json({ ok:true, admin:created }, 201);
    } catch (error) {
      return json({ error:error instanceof Error ? error.message : 'Admin yaratilmadi' }, 400);
    }
  }

  const adminMatch = path.match(/^\/api\/control\/admins\/([^/]+)\/(reset|status)$/);
  if (adminMatch && method === 'POST') {
    const decision = authorize(resolved.profile, 'ASSIGN_ADMIN', { kind:'ADMIN_PROFILE', districtId:null, facilityId:null });
    if (!decision.allowed) return json({ error:'Forbidden', reason:decision.reason }, 403);
    const username = decodeURIComponent(adminMatch[1]);
    const body = await readJson(request);
    if (adminMatch[2] === 'reset') {
      const ok = await deps.resetManagedAdmin(username, String(body.password || ''), resolved.profile.username);
      return ok ? json({ok:true}) : json({error:'Topilmadi'},404);
    }
    const ok = await deps.setManagedAdminActive(username, !!body.active, resolved.profile.username);
    return ok ? json({ok:true}) : json({error:'Topilmadi'},404);
  }

  return json({ error:'Not found' }, 404);
}

function rowToInstitution(row: any): ManagedInstitution {
  return { id:String(row.id), name:String(row.name), type:String(row.type), scope:row.scope ?? null, parentId:row.parent_id ?? null };
}

function rowToUser(row: any): ManagedUser {
  return {
    id:String(row.id), username:String(row.username), role:String(row.role), active:row.active !== false,
    institutionId:String(row.institution_id), institutionName:String(row.institution_name),
    institutionType:String(row.institution_type), scope:row.scope ?? null,
  };
}

function passwordValid(password: string): boolean {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export function createDefaultAdminApiDeps(sql: SqlLike): AdminApiDeps {
  return {
    resolveActor: async (request, innerFetch) => {
      const meRequest = new Request(new URL(LegacyAdminContract.me, request.url), { method:'GET', headers:new Headers(request.headers) });
      const response = await innerFetch(meRequest);
      if (!response.ok) return null;
      const actor = normalizeLegacyActor(await response.json().catch(()=>null));
      if (!actor) return null;
      let profile = await getProfile(sql, actor.username);
      if (!profile && actor.role !== 'ADMIN' && actor.institutionId) {
        profile = {
          username: actor.username,
          role:'FACILITY', scopeType:'facility', districtId:actor.scope,
          facilityId:actor.institutionId, controlMode:null, active:true,
        };
      }
      return profile ? { actor, profile } : null;
    },
    findInstitution: async id => {
      const rows = await sql`SELECT id,name,type,scope,parent_id FROM app_institutions WHERE id=${id} AND active=true LIMIT 1`;
      return rows[0] ? rowToInstitution(rows[0]) : null;
    },
    findUser: async id => {
      const rows = await sql`SELECT u.id,u.username,u.role,u.active,u.institution_id,i.name institution_name,i.type institution_type,i.scope FROM app_users u JOIN app_institutions i ON i.id=u.institution_id WHERE u.id=${id} LIMIT 1`;
      return rows[0] ? rowToUser(rows[0]) : null;
    },
    listInstitutions: async () => {
      const rows = await sql`SELECT id,name,type,scope,parent_id FROM app_institutions WHERE active=true ORDER BY scope,type,name`;
      return rows.map(rowToInstitution);
    },
    listUsers: async () => {
      const rows = await sql`SELECT u.id,u.username,u.role,u.active,u.institution_id,i.name institution_name,i.type institution_type,i.scope FROM app_users u JOIN app_institutions i ON i.id=u.institution_id WHERE u.institution_id IS NOT NULL ORDER BY i.scope,i.type,i.name,u.username`;
      return rows.map(rowToUser);
    },
    listAdmins: async () => listAdminProfiles(sql),
    createManagedAdmin: async (input, actorUsername) => {
      const username = normalizeUsername(input.username);
      if (!username || !passwordValid(input.password)) throw new Error('Login va kamida 8 belgili parol kerak');
      const profile: AccessProfile = {
        username,
        role:input.role,
        scopeType:input.role === 'ADMIN' ? 'district' : input.scopeType,
        districtId:input.role === 'ADMIN' ? input.districtId : (input.scopeType === 'district' ? input.districtId : null),
        facilityId:null,
        controlMode:input.role === 'CONTROL_ADMIN' ? input.controlMode : null,
        active:true,
      };
      validateAccessProfile(profile);
      const exists = await sql`SELECT id FROM app_users WHERE lower(username)=${username} LIMIT 1`;
      if (exists.length) throw new Error('Bu login band');
      const id = randomUUID();
      const legacyScope = profile.scopeType === 'district' ? profile.districtId : null;
      await sql`INSERT INTO app_users(id,username,password_hash,role,institution_id,scope,active) VALUES(${id},${username},${hashLegacyPassword(input.password)},'ADMIN',NULL,${legacyScope},true)`;
      try {
        await upsertAdminProfile(sql, profile);
      } catch (error) {
        await sql`DELETE FROM app_users WHERE id=${id} AND username=${username}`;
        throw error;
      }
      await appendAdminAudit(sql,{actorUsername,action:'ADMIN_CREATE',targetId:username,details:{role:profile.role,scopeType:profile.scopeType,districtId:profile.districtId,controlMode:profile.controlMode}});
      return profile;
    },
    resetManagedAdmin: async (username, password, actorUsername) => {
      const key=normalizeUsername(username); if(!passwordValid(password)) throw new Error('Parol kamida 8 belgi');
      const p=await getProfile(sql,key); if(!p||p.role==='SUPER_ADMIN') return false;
      const rows=await sql`UPDATE app_users SET password_hash=${hashLegacyPassword(password)},updated_at=now() WHERE lower(username)=${key} AND role='ADMIN' RETURNING id`;
      if(!rows.length)return false;
      await appendAdminAudit(sql,{actorUsername,action:'ADMIN_PASSWORD_RESET',targetId:key,details:{}}); return true;
    },
    setManagedAdminActive: async (username, active, actorUsername) => {
      const key=normalizeUsername(username); const p=await getProfile(sql,key); if(!p||p.role==='SUPER_ADMIN')return false;
      const rows=await sql`UPDATE app_users SET active=${!!active},updated_at=now() WHERE lower(username)=${key} AND role='ADMIN' RETURNING id`;
      if(!rows.length)return false; await setProfileActive(sql,key,active);
      await appendAdminAudit(sql,{actorUsername,action:active?'ADMIN_ACTIVATE':'ADMIN_DEACTIVATE',targetId:key,details:{active}}); return true;
    },
    audit: event => appendAdminAudit(sql,event),
  };
}
