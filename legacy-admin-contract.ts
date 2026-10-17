export const LegacyAdminContract = {
  me: '/api/v1/me',
  listUsers: '/api/v1/admin/users',
  createUser: '/api/v1/admin/users',
  resetUser: (id: string) => `/api/v1/admin/users/${encodeURIComponent(id)}/reset`,
  setUserActive: (id: string) => `/api/v1/admin/users/${encodeURIComponent(id)}/status`,
} as const;

export type LegacyActor = {
  id: string;
  username: string;
  role: string;
  institutionId: string | null;
  scope: string | null;
};

export function normalizeLegacyActor(payload: unknown): LegacyActor | null {
  if (!payload || typeof payload !== 'object') return null;
  const v = payload as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.username !== 'string' || typeof v.role !== 'string') return null;
  const institutionId = v.institutionId == null ? null : typeof v.institutionId === 'string' ? v.institutionId : null;
  const scope = v.scope == null ? null : typeof v.scope === 'string' ? v.scope : null;
  if (v.institutionId != null && institutionId == null) return null;
  if (v.scope != null && scope == null) return null;
  return { id: v.id, username: v.username, role: v.role, institutionId, scope };
}
