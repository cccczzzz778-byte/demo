export type AccessRole = 'SUPER_ADMIN' | 'ADMIN' | 'CONTROL_ADMIN' | 'FACILITY';
export type ScopeType = 'province' | 'district' | 'facility';
export type ControlMode = 'active' | 'viewer' | null;
export type RbacAction = 'VIEW' | 'CREATE_CREDENTIAL' | 'RESET_CREDENTIAL' | 'SET_ACTIVE' | 'ASSIGN_ADMIN' | 'MANAGE_SESSION' | 'MANAGE_HIERARCHY';
export type ResourceKind = 'DPM' | 'FACILITY' | 'ADMIN_PROFILE' | 'SESSION' | 'HIERARCHY';

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
  kind: ResourceKind;
  districtId: string | null;
  facilityId: string | null;
};

export type AuthorizationResult = { allowed: boolean; reason: string };

export function canonicalDistrict(name: string | null): string | null {
  if (name == null) return null;
  let value = String(name).trim().toLowerCase();
  if (!value) return null;
  value = value
    .replace(/[‘’ʻʼ`´']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+tumani$/u, '')
    .trim();
  if (!value) return null;
  if (value.endsWith(' shahri')) value = value.slice(0, -7).trim() + '-shahri';
  return value.replace(/\s+/g, '-');
}

function deny(reason: string): AuthorizationResult { return { allowed: false, reason }; }
function allow(reason = 'allowed'): AuthorizationResult { return { allowed: true, reason }; }

function inDistrict(profile: AccessProfile, target: ResourceScope): boolean {
  const own = canonicalDistrict(profile.districtId);
  const wanted = canonicalDistrict(target.districtId);
  return !!own && !!wanted && own === wanted;
}

function credentialAction(action: RbacAction): boolean {
  return action === 'CREATE_CREDENTIAL' || action === 'RESET_CREDENTIAL' || action === 'SET_ACTIVE';
}

export function authorize(profile: AccessProfile, action: RbacAction, target: ResourceScope): AuthorizationResult {
  if (!profile.active) return deny('inactive profile');
  if (profile.role === 'SUPER_ADMIN') return allow('super admin');

  if (action === 'ASSIGN_ADMIN' || action === 'MANAGE_SESSION' || action === 'MANAGE_HIERARCHY') {
    return deny('super admin only');
  }

  if (profile.role === 'FACILITY') {
    if (action === 'VIEW' && target.kind === 'FACILITY' && !!profile.facilityId && profile.facilityId === target.facilityId) {
      return allow('own facility');
    }
    return deny('facility user is read-only outside own facility');
  }

  if (profile.role === 'ADMIN') {
    if (profile.scopeType !== 'district' || !canonicalDistrict(profile.districtId)) return deny('admin requires one district');
    if (!inDistrict(profile, target)) return deny('outside assigned district');
    if (target.kind === 'DPM' && credentialAction(action)) return deny('DPM credential is super admin only');
    if (action === 'VIEW') return allow('district view');
    if (credentialAction(action) && target.kind !== 'DPM') return allow('district credential management');
    return deny('action not allowed');
  }

  if (profile.role === 'CONTROL_ADMIN') {
    if (profile.controlMode !== 'active' && profile.controlMode !== 'viewer') return deny('invalid control mode');
    const province = profile.scopeType === 'province';
    const district = profile.scopeType === 'district' && !!canonicalDistrict(profile.districtId);
    if (!province && !district) return deny('invalid control scope');
    if (!province && !inDistrict(profile, target)) return deny('outside assigned district');

    if (action === 'VIEW') {
      if (target.kind === 'DPM' && !province) return deny('district control admin cannot view DPM');
      return allow(province ? 'province view' : 'district view');
    }

    if (profile.controlMode === 'viewer') return deny('viewer is read-only');
    if (target.kind === 'DPM' && credentialAction(action)) return deny('DPM credential is super admin only');
    if (credentialAction(action) && target.kind !== 'DPM') return allow('active control credential management');
    return deny('action not allowed');
  }

  return deny('unknown role');
}
