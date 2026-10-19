import { describe, expect, test } from 'bun:test';
import { authorize, type AccessProfile } from './rbac.ts';

const facility=(facilityId:string):AccessProfile=>({
  username:`facility-${facilityId}`,
  role:'FACILITY',
  scopeType:'facility',
  districtId:null,
  facilityId,
  controlMode:null,
  active:true,
});

describe('facility scoped login permissions',()=>{
  for(const kind of ['OP','OSHP','KTMP'] as const){
    test(`${kind} can edit only its own facility dashboard`,()=>{
      const profile=facility(`${kind.toLowerCase()}-001`);
      const own=authorize(profile,'EDIT' as any,{district:'Gijduvon',facilityId:profile.facilityId,isDpm:false});
      const other=authorize(profile,'EDIT' as any,{district:'Gijduvon',facilityId:'other-002',isDpm:false});
      expect(own.allowed).toBe(true);
      expect(other.allowed).toBe(false);
    });
  }
});
