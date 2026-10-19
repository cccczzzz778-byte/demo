import { describe, expect, test } from 'bun:test';
import { authorize, type AccessProfile } from './rbac.ts';

const facility=(facilityId:string,active=true):AccessProfile=>({
  username:`facility-${facilityId}`,
  role:'FACILITY',
  scopeType:'facility',
  districtId:null,
  facilityId,
  controlMode:null,
  active,
});

describe('facility scoped login permissions',()=>{
  for(const kind of ['OP','OSHP','KTMP'] as const){
    test(`${kind} can view and edit only its own facility dashboard`,()=>{
      const profile=facility(`${kind.toLowerCase()}-001`);
      const own={district:'Gijduvon',facilityId:profile.facilityId,isDpm:false};
      const other={district:'Gijduvon',facilityId:'other-002',isDpm:false};
      expect(authorize(profile,'VIEW',own).allowed).toBe(true);
      expect(authorize(profile,'EDIT_FACILITY_DATA',own).allowed).toBe(true);
      expect(authorize(profile,'VIEW',other).allowed).toBe(false);
      expect(authorize(profile,'EDIT_FACILITY_DATA',other).allowed).toBe(false);
    });
  }

  test('inactive facility cannot view or edit even its own dashboard',()=>{
    const profile=facility('ktmp-001',false);
    const own={district:'Gijduvon',facilityId:'ktmp-001',isDpm:false};
    expect(authorize(profile,'VIEW',own).allowed).toBe(false);
    expect(authorize(profile,'EDIT_FACILITY_DATA',own).allowed).toBe(false);
  });
});
