export type LegacyActor = {
  id: string;
  username: string;
  role: string;
  institutionId: string | null;
  scope: string | null;
};

export const LegacyAdminContract = {
  me: '/api/v1/me',
  listUsers: '/api/v1/admin/users',
  createUser: '/api/v1/admin/users',
  institutions: '/api/v1/institutions',
  resetUser: (id: string) => `/api/v1/admin/users/${encodeURIComponent(id)}/reset`,
  setUserActive: (id: string) => `/api/v1/admin/users/${encodeURIComponent(id)}/status`,
} as const;

export function normalizeLegacyActor(payload: unknown): LegacyActor | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.id !== 'string' || !p.id) return null;
  if (typeof p.username !== 'string' || !p.username) return null;
  if (typeof p.role !== 'string' || !p.role) return null;
  const institutionId = p.institutionId == null ? null : p.institutionId;
  const scope = p.scope == null ? null : p.scope;
  if (institutionId !== null && typeof institutionId !== 'string') return null;
  if (scope !== null && typeof scope !== 'string') return null;
  return { id: p.id, username: p.username, role: p.role, institutionId, scope };
}
