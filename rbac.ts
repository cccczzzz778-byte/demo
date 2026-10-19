export type AccessRole = 'SUPER_ADMIN' | 'ADMIN' | 'CONTROL_ADMIN' | 'FACILITY';
export type ScopeType = 'province' | 'district' | 'facility';
export type ControlMode = 'active' | 'viewer' | null;
export type RbacAction = 'VIEW' | 'EDIT_FACILITY_DATA' | 'CREATE_CREDENTIAL' | 'RESET_CREDENTIAL' | 'SET_ACTIVE' | 'ASSIGN_ADMIN' | 'MANAGE_SESSION' | 'MANAGE_HIERARCHY';

export type AccessProfile = {
  username: string;
  role: AccessRole;
  scopeType: ScopeType;
  districtId: string | null;
  facilityId: string | null;
  controlMode: ControlMode;
  active: boolean;
};

export type ResourceScope = {
  district: string | null;
  facilityId: string | null;
  isDpm: boolean;
};

function asciiApostrophe(value: string) {
  return value.replace(/[ʻʼ’‘`´]/g, "'");
}

export function canonicalDistrict(name: string | null): string | null {
  if (!name) return null;
  let v = asciiApostrophe(name).replace(/'/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (v.endsWith(' tumani')) v = v.slice(0, -7).trim();
  return v;
}

function districtMatches(profileDistrict: string | null, targetDistrict: string | null) {
  const a = canonicalDistrict(profileDistrict);
  const b = canonicalDistrict(targetDistrict);
  return !!a && !!b && a === b;
}

export function authorize(profile: AccessProfile, action: RbacAction, target: ResourceScope): { allowed: boolean; reason: string } {
  if (!profile.active) return { allowed: false, reason: 'inactive-profile' };
  if (profile.role === 'SUPER_ADMIN') return { allowed: true, reason: 'super-admin' };

  if (profile.role === 'FACILITY') {
    const ownFacility = !!profile.facilityId && target.facilityId === profile.facilityId;
    const allowed = ownFacility && (action === 'VIEW' || action === 'EDIT_FACILITY_DATA');
    return { allowed, reason: allowed ? 'own-facility' : 'facility-role-denied' };
  }

  if (profile.role === 'ADMIN') {
    if (profile.scopeType !== 'district' || !districtMatches(profile.districtId, target.district)) return { allowed: false, reason: 'district-scope-mismatch' };
    if (target.isDpm) return { allowed: false, reason: 'dpm-super-admin-only' };
    const allowed = action === 'VIEW' || action === 'EDIT_FACILITY_DATA' || action === 'CREATE_CREDENTIAL' || action === 'RESET_CREDENTIAL' || action === 'SET_ACTIVE' || action === 'MANAGE_HIERARCHY';
    return { allowed, reason: allowed ? 'district-admin' : 'admin-action-denied' };
  }

  if (profile.role === 'CONTROL_ADMIN') {
    const inScope = profile.scopeType === 'province' || (profile.scopeType === 'district' && districtMatches(profile.districtId, target.district));
    if (!inScope) return { allowed: false, reason: 'control-scope-mismatch' };
    if (action === 'VIEW') return { allowed: true, reason: 'control-view' };
    if (profile.controlMode !== 'active') return { allowed: false, reason: 'viewer-read-only' };
    if (target.isDpm) return { allowed: false, reason: 'dpm-super-admin-only' };
    const allowed = action === 'EDIT_FACILITY_DATA' || action === 'CREATE_CREDENTIAL' || action === 'RESET_CREDENTIAL' || action === 'SET_ACTIVE';
    return { allowed, reason: allowed ? 'control-active' : 'control-action-denied' };
  }

  return { allowed: false, reason: 'unknown-role' };
}
