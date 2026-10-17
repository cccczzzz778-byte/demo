import { authorize, canonicalDistrict, type AccessProfile, type ResourceScope } from './rbac';

export type InstitutionRecord = {
  id: string;
  name: string;
  type: string;
  scope: string | null;
  parentId: string | null;
};

export type InstitutionLevel = 'province' | 'district';
export type InstitutionCenter = InstitutionRecord & { children: InstitutionRecord[] };
export type DistrictHierarchy = {
  key: string;
  label: string;
  centers: InstitutionCenter[];
  unparented: InstitutionRecord[];
};
export type InstitutionHierarchy = {
  province: InstitutionRecord[];
  districts: DistrictHierarchy[];
  unassigned: InstitutionRecord[];
};

const PROVINCE_TYPES = new Set(['DPM','SSB']);
const CENTER_TYPES = new Set(['TTB','SHTB']);

export function institutionLevel(inst: InstitutionRecord): InstitutionLevel {
  return PROVINCE_TYPES.has(String(inst.type || '').toUpperCase()) ? 'province' : 'district';
}

export function institutionResource(inst: InstitutionRecord): ResourceScope {
  return {
    kind: institutionLevel(inst) === 'province' ? 'DPM' : 'FACILITY',
    districtId: inst.scope,
    facilityId: inst.id,
  };
}

export function filterInstitutionsForProfile(profile: AccessProfile, rows: InstitutionRecord[]): InstitutionRecord[] {
  return rows.filter(inst => {
    if (profile.role === 'SUPER_ADMIN') return true;
    if (institutionLevel(inst) === 'district' && !canonicalDistrict(inst.scope)) return false;
    return authorize(profile, 'VIEW', institutionResource(inst)).allowed;
  });
}

function districtLabel(scope: string | null, key: string): string {
  const raw = String(scope || '').trim();
  return raw || key;
}

export function buildInstitutionHierarchy(profile: AccessProfile, rows: InstitutionRecord[]): InstitutionHierarchy {
  const visible = filterInstitutionsForProfile(profile, rows);
  const province = visible.filter(x => institutionLevel(x) === 'province');
  const unassigned = visible.filter(x => institutionLevel(x) === 'district' && !canonicalDistrict(x.scope));
  const districtRows = visible.filter(x => institutionLevel(x) === 'district' && !!canonicalDistrict(x.scope));
  const groups = new Map<string, InstitutionRecord[]>();
  for (const inst of districtRows) {
    const key = canonicalDistrict(inst.scope)!;
    const group = groups.get(key) || [];
    group.push(inst);
    groups.set(key, group);
  }

  const districts: DistrictHierarchy[] = [...groups.entries()].map(([key, group]) => {
    const centers = group
      .filter(x => CENTER_TYPES.has(String(x.type || '').toUpperCase()))
      .map(x => ({ ...x, children: [] as InstitutionRecord[] }));
    const byId = new Map(centers.map(x => [x.id, x]));
    const unparented: InstitutionRecord[] = [];
    for (const inst of group) {
      if (CENTER_TYPES.has(String(inst.type || '').toUpperCase())) continue;
      const parent = inst.parentId ? byId.get(inst.parentId) : null;
      if (parent) parent.children.push(inst);
      else unparented.push(inst);
    }
    for (const center of centers) center.children.sort((a,b)=>a.name.localeCompare(b.name,'uz'));
    centers.sort((a,b)=>a.name.localeCompare(b.name,'uz'));
    unparented.sort((a,b)=>a.name.localeCompare(b.name,'uz'));
    return { key, label: districtLabel(group[0]?.scope || null, key), centers, unparented };
  });
  districts.sort((a,b)=>a.label.localeCompare(b.label,'uz'));
  province.sort((a,b)=>a.name.localeCompare(b.name,'uz'));
  unassigned.sort((a,b)=>a.name.localeCompare(b.name,'uz'));
  return { province, districts, unassigned };
}
