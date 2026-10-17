import { buildInstitutionHierarchy, filterInstitutionsForProfile, institutionLevel, type InstitutionRecord } from './institution-adapter';
import { authorize, canonicalDistrict, type AccessProfile } from './rbac';
import { appendAdminAudit, listAdminProfiles, redactAuditDetails, type SqlLike } from './rbac-store';
import { getRuntimeMetrics, listPresence, revokeSession as storeRevokeSession, type MonitorSqlLike, type SessionPresence } from './admin-monitor-store';

export type MonitoringUser = {
  id: string;
  username: string;
  role: string;
  active: boolean;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  scope: string | null;
};

export type SecurityEventView = {
  id: string;
  createdAt: string;
  method: string;
  path: string;
  action: string;
  detail: unknown;
};

export type AdminAuditView = {
  actorUsername: string | null;
  action: string;
  targetId: string | null;
  details: unknown;
  createdAt: string;
};

export type HierarchyUpdate = {
  institutionId: string;
  parentId: string | null;
  scope: string | null;
};

export type HealthView = {
  app: 'up';
  database: 'up' | 'down';
  deploymentId: string | null;
  memory: { rssBytes: number; heapUsedBytes: number };
  cpu: { userMs: number; systemMs: number };
  runtime: ReturnType<typeof getRuntimeMetrics>;
};

export type MonitoringApiDeps = {
  listInstitutions(): Promise<InstitutionRecord[]>;
  listUsers(): Promise<MonitoringUser[]>;
  listAdmins(): Promise<AccessProfile[]>;
  listSessions(): Promise<SessionPresence[]>;
  revokeSession(sessionHash: string, actorUsername: string): Promise<void>;
  listSecurityEvents(limit?: number): Promise<SecurityEventView[]>;
  listAudit(limit?: number): Promise<AdminAuditView[]>;
  health(): Promise<HealthView>;
  updateHierarchy(input: HierarchyUpdate, actorUsername: string): Promise<boolean>;
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

function canProvinceMonitor(profile: AccessProfile): boolean {
  return profile.active && (profile.role === 'SUPER_ADMIN' || (profile.role === 'CONTROL_ADMIN' && profile.scopeType === 'province'));
}

function permissions(profile: AccessProfile) {
  const superAdmin = profile.role === 'SUPER_ADMIN';
  const activeControl = profile.role === 'CONTROL_ADMIN' && profile.controlMode === 'active';
  return {
    canManageAdmins: superAdmin,
    canManageHierarchy: superAdmin,
    canManageSessions: superAdmin,
    canManageCredentials: superAdmin || profile.role === 'ADMIN' || activeControl,
    canViewProvinceMonitoring: canProvinceMonitor(profile),
    readOnly: profile.role === 'CONTROL_ADMIN' && profile.controlMode === 'viewer',
  };
}

export async function handleMonitoringControlApi(
  request: Request,
  profile: AccessProfile,
  deps: MonitoringApiDeps,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (path === '/api/control/summary' && method === 'GET') {
    if (profile.role === 'FACILITY') return json({ error: 'Forbidden' }, 403);
    const visible = filterInstitutionsForProfile(profile, await deps.listInstitutions());
    const ids = new Set(visible.map(x => x.id));
    const users = (await deps.listUsers()).filter(x => ids.has(x.institutionId));
    const byType: Record<string, number> = {};
    for (const inst of visible) byType[inst.type] = (byType[inst.type] || 0) + 1;
    const districtKeys = new Set(visible.filter(x => institutionLevel(x) === 'district').map(x => canonicalDistrict(x.scope)).filter(Boolean));
    const adminTotal = profile.role === 'SUPER_ADMIN' ? (await deps.listAdmins()).length : 0;
    return json({
      institutions: { total: visible.length, byType, districts: districtKeys.size },
      users: { total: users.length, active: users.filter(x => x.active).length },
      admins: { total: adminTotal },
    });
  }

  if (path === '/api/control/hierarchy' && method === 'GET') {
    if (profile.role === 'FACILITY') return json({ error: 'Forbidden' }, 403);
    return json({ hierarchy: buildInstitutionHierarchy(profile, await deps.listInstitutions()) });
  }

  if (path === '/api/control/hierarchy' && method === 'POST') {
    const decision = authorize(profile, 'MANAGE_HIERARCHY', { kind: 'HIERARCHY', districtId: null, facilityId: null });
    if (!decision.allowed) return json({ error: 'Forbidden', reason: decision.reason }, 403);
    const body = await readJson(request);
    const input: HierarchyUpdate = {
      institutionId: String(body.institutionId || ''),
      parentId: body.parentId == null || body.parentId === '' ? null : String(body.parentId),
      scope: body.scope == null || body.scope === '' ? null : String(body.scope),
    };
    if (!input.institutionId) return json({ error: 'Muassasa tanlanmagan' }, 400);
    try {
      const ok = await deps.updateHierarchy(input, profile.username);
      return ok ? json({ ok: true }) : json({ error: 'Iyerarxiya yangilanmadi' }, 400);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : 'Iyerarxiya yangilanmadi' }, 400);
    }
  }

  if (path === '/api/control/sessions' && method === 'GET') {
    if (!canProvinceMonitor(profile)) return json({ error: 'Forbidden' }, 403);
    return json({ sessions: await deps.listSessions() });
  }

  const revoke = path.match(/^\/api\/control\/sessions\/([0-9a-f]{64})\/revoke$/i);
  if (revoke && method === 'POST') {
    const decision = authorize(profile, 'MANAGE_SESSION', { kind: 'SESSION', districtId: null, facilityId: null });
    if (!decision.allowed) return json({ error: 'Forbidden', reason: decision.reason }, 403);
    await deps.revokeSession(revoke[1].toLowerCase(), profile.username);
    return json({ ok: true });
  }

  if (path === '/api/control/security-events' && method === 'GET') {
    if (!canProvinceMonitor(profile)) return json({ error: 'Forbidden' }, 403);
    return json({ events: await deps.listSecurityEvents(200) });
  }

  if (path === '/api/control/audit' && method === 'GET') {
    if (!canProvinceMonitor(profile)) return json({ error: 'Forbidden' }, 403);
    return json({ events: await deps.listAudit(200) });
  }

  if (path === '/api/control/health' && method === 'GET') {
    if (!canProvinceMonitor(profile)) return json({ error: 'Forbidden' }, 403);
    return json(await deps.health());
  }

  if (path === '/api/control/settings' && method === 'GET') {
    if (profile.role === 'FACILITY') return json({ error: 'Forbidden' }, 403);
    return json({
      role: profile.role,
      scopeType: profile.scopeType,
      districtId: profile.districtId,
      controlMode: profile.controlMode,
      permissions: permissions(profile),
      features: { dashboardConstructor: false },
    });
  }

  return null;
}

function toInstitution(row: any): InstitutionRecord {
  return { id: String(row.id), name: String(row.name), type: String(row.type), scope: row.scope ?? null, parentId: row.parent_id ?? null };
}

function toUser(row: any): MonitoringUser {
  return {
    id: String(row.id), username: String(row.username), role: String(row.role), active: row.active !== false,
    institutionId: String(row.institution_id), institutionName: String(row.institution_name),
    institutionType: String(row.institution_type), scope: row.scope ?? null,
  };
}

export function createDefaultMonitoringApiDeps(sql: SqlLike & MonitorSqlLike): MonitoringApiDeps {
  return {
    listInstitutions: async () => {
      const rows = await sql`SELECT id,name,type,scope,parent_id FROM app_institutions WHERE active=true ORDER BY scope,type,name`;
      return rows.map(toInstitution);
    },
    listUsers: async () => {
      const rows = await sql`SELECT u.id,u.username,u.role,u.active,u.institution_id,i.name institution_name,i.type institution_type,i.scope
        FROM app_users u JOIN app_institutions i ON i.id=u.institution_id
        WHERE u.institution_id IS NOT NULL ORDER BY i.scope,i.type,i.name,u.username`;
      return rows.map(toUser);
    },
    listAdmins: async () => listAdminProfiles(sql),
    listSessions: async () => listPresence(sql),
    revokeSession: async (sessionHash, actorUsername) => storeRevokeSession(sql, sessionHash, actorUsername),
    listSecurityEvents: async (limit = 200) => {
      const n = Math.max(1, Math.min(500, Number(limit) || 200));
      const rows = await sql`SELECT id,created_at,method,path,action,detail FROM app_security_events ORDER BY created_at DESC LIMIT ${n}`;
      return rows.map((r: any) => ({
        id: String(r.id), createdAt: String(r.created_at), method: String(r.method), path: String(r.path), action: String(r.action),
        detail: redactAuditDetails(r.detail ?? {}),
      }));
    },
    listAudit: async (limit = 200) => {
      const n = Math.max(1, Math.min(500, Number(limit) || 200));
      const rows = await sql`SELECT actor_username,action,target_id,details,created_at FROM app_admin_audit ORDER BY created_at DESC LIMIT ${n}`;
      return rows.map((r: any) => ({
        actorUsername: r.actor_username ?? null, action: String(r.action), targetId: r.target_id ?? null,
        details: redactAuditDetails(r.details ?? {}), createdAt: String(r.created_at),
      }));
    },
    health: async () => {
      let database: 'up' | 'down' = 'down';
      try { await sql`SELECT 1 AS ok`; database = 'up'; } catch {}
      const memory = process.memoryUsage();
      const cpu = process.cpuUsage();
      return {
        app: 'up', database,
        deploymentId: Bun.env.RAILWAY_DEPLOYMENT_ID || null,
        memory: { rssBytes: memory.rss, heapUsedBytes: memory.heapUsed },
        cpu: { userMs: cpu.user / 1000, systemMs: cpu.system / 1000 },
        runtime: getRuntimeMetrics(),
      };
    },
    updateHierarchy: async (input, actorUsername) => {
      const targetRows = await sql`SELECT id,name,type,scope,parent_id FROM app_institutions WHERE id=${input.institutionId} AND active=true LIMIT 1`;
      if (!targetRows.length) throw new Error('Muassasa topilmadi');
      const target = toInstitution(targetRows[0]);
      const type = target.type.toUpperCase();
      let nextParent: string | null = input.parentId;
      let nextScope: string | null = input.scope ?? target.scope;

      if (type === 'DPM' || type === 'SSB') {
        if (nextParent) throw new Error('DPM/SSB tuman iyerarxiyasiga biriktirilmaydi');
        nextParent = null;
      } else if (nextParent) {
        const parentRows = await sql`SELECT id,name,type,scope,parent_id FROM app_institutions WHERE id=${nextParent} AND active=true LIMIT 1`;
        if (!parentRows.length) throw new Error('Bosh muassasa topilmadi');
        const parent = toInstitution(parentRows[0]);
        if (!['TTB','SHTB'].includes(parent.type.toUpperCase())) throw new Error('Bosh muassasa TTB yoki SHTB bo‘lishi kerak');
        if (['TTB','SHTB'].includes(type)) throw new Error('TTB/SHTB boshqa markazga biriktirilmaydi');
        const parentScope = canonicalDistrict(parent.scope);
        if (!parentScope) throw new Error('Bosh muassasa hududi aniqlanmagan');
        if (input.scope && canonicalDistrict(input.scope) !== parentScope) throw new Error('Muassasa va bosh muassasa hududi mos emas');
        nextScope = parent.scope;
      }

      const updated = await sql`UPDATE app_institutions SET parent_id=${nextParent},scope=${nextScope},updated_at=now() WHERE id=${target.id} RETURNING id`;
      if (!updated.length) return false;
      await appendAdminAudit(sql, { actorUsername, action: 'HIERARCHY_UPDATE', targetId: target.id, details: { parentId: nextParent, scope: nextScope } });
      return true;
    },
  };
}
