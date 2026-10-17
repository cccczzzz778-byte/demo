import { describe, expect, test } from 'bun:test';
import { handleMonitoringControlApi, type MonitoringApiDeps } from '../super-admin-monitor-api';
import type { ManagedInstitution, ManagedUser } from '../super-admin-api';
import type { AccessProfile } from '../rbac';

const profiles={
  super:{username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:null,active:true},
  district:{username:'gij-admin',role:'ADMIN',scopeType:'district',districtId:"G'ijduvon",facilityId:null,controlMode:null,active:true},
  provinceViewer:{username:'naz-view',role:'CONTROL_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:'viewer',active:true},
} satisfies Record<string,AccessProfile>;

const institutions:ManagedInstitution[]=[
  {id:'dpm',name:'Viloyat DPM',type:'DPM',scope:'Buxoro shahri',parentId:null},
  {id:'gij-ttb',name:'Gijduvon TTB',type:'TTB',scope:"G'ijduvon",parentId:null},
  {id:'gij-op',name:'Gijduvon OP',type:'OP',scope:"G‘ijduvon tumani",parentId:'gij-ttb'},
  {id:'jon-ttb',name:'Jondor TTB',type:'TTB',scope:'Jondor',parentId:null},
  {id:'jon-op',name:'Jondor OP',type:'OP',scope:'Jondor',parentId:'jon-ttb'},
];
const users:ManagedUser[]=[
  {id:'ug',username:'g-op',role:'DATA_ENTRY',active:true,institutionId:'gij-op',institutionName:'Gijduvon OP',institutionType:'OP',scope:"G'ijduvon"},
  {id:'uj',username:'j-op',role:'DATA_ENTRY',active:true,institutionId:'jon-op',institutionName:'Jondor OP',institutionType:'OP',scope:'Jondor'},
  {id:'ud',username:'dpm',role:'DATA_ENTRY',active:true,institutionId:'dpm',institutionName:'Viloyat DPM',institutionType:'DPM',scope:'Buxoro shahri'},
];

function req(path:string,method='GET',body?:unknown){return new Request('https://x.test'+path,{method,headers:body===undefined?{}:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})}

function depsFor(){
  const calls:any[]=[];
  const deps:MonitoringApiDeps={
    listInstitutions:async()=>institutions,
    listUsers:async()=>users,
    listAdmins:async()=>[profiles.super,profiles.district,profiles.provinceViewer],
    listSessions:async()=>[
      {sessionHash:'a'.repeat(64),username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,facilityId:null,device:'desktop',browser:'Chrome',firstSeen:'2026-10-17T00:00:00Z',lastSeen:'2026-10-17T01:00:00Z'},
    ],
    revokeSession:async(hash,by)=>{calls.push(['revoke',hash,by])},
    listSecurityEvents:async()=>[{id:'s1',createdAt:'2026-10-17T00:00:00Z',method:'POST',path:'/api/auth/login',action:'RATE_LIMIT',detail:{count:13}}],
    listAudit:async()=>[{actorUsername:'admin',action:'ADMIN_CREATE',targetId:'u1',details:{role:'ADMIN'},createdAt:'2026-10-17T00:00:00Z'}],
    health:async()=>({app:'up',database:'up',deploymentId:'dep-safe',memory:{rssBytes:123,heapUsedBytes:45},cpu:{userMs:1,systemMs:2},runtime:{requestTotal:10,serverErrorTotal:1,serverErrorRate:.1,averageDurationMs:12}}),
    updateHierarchy:async(input,by)=>{calls.push(['hierarchy',input,by]);return true},
  };
  return {deps,calls};
}

describe('summary and hierarchy',()=>{
  test('district Admin summary and hierarchy contain only its district and no DPM',async()=>{
    const {deps}=depsFor();
    const sr=await handleMonitoringControlApi(req('/api/control/summary'),profiles.district,deps); const s=await sr!.json();
    expect(sr?.status).toBe(200);
    expect(s.institutions.total).toBe(2);
    expect(s.institutions.byType).toEqual({TTB:1,OP:1});
    expect(s.users.total).toBe(1);
    const hr=await handleMonitoringControlApi(req('/api/control/hierarchy'),profiles.district,deps); const h=await hr!.json();
    expect(h.hierarchy.province).toEqual([]);
    expect(h.hierarchy.districts.map((x:any)=>x.key)).toEqual(['gijduvon']);
  });

  test('Super Admin hierarchy keeps DPM at province level',async()=>{
    const {deps}=depsFor();
    const hr=await handleMonitoringControlApi(req('/api/control/hierarchy'),profiles.super,deps);const h=await hr!.json();
    expect(h.hierarchy.province.map((x:any)=>x.id)).toEqual(['dpm']);
  });
});

describe('monitoring endpoints',()=>{
  test('province viewer may read sessions/security/audit/health but cannot revoke a session',async()=>{
    const {deps,calls}=depsFor();
    for(const path of ['/api/control/sessions','/api/control/security-events','/api/control/audit','/api/control/health']){
      const r=await handleMonitoringControlApi(req(path),profiles.provinceViewer,deps); expect(r?.status).toBe(200);
    }
    const r=await handleMonitoringControlApi(req('/api/control/sessions/'+'a'.repeat(64)+'/revoke','POST'),profiles.provinceViewer,deps);
    expect(r?.status).toBe(403); expect(calls).toEqual([]);
  });

  test('ordinary district Admin cannot read province security/server/session monitoring',async()=>{
    const {deps}=depsFor();
    for(const path of ['/api/control/sessions','/api/control/security-events','/api/control/health']){
      const r=await handleMonitoringControlApi(req(path),profiles.district,deps); expect(r?.status).toBe(403);
    }
  });

  test('Super Admin can revoke an opaque session hash',async()=>{
    const {deps,calls}=depsFor();const hash='b'.repeat(64);
    const r=await handleMonitoringControlApi(req('/api/control/sessions/'+hash+'/revoke','POST'),profiles.super,deps);
    expect(r?.status).toBe(200); expect(calls[0]).toEqual(['revoke',hash,'admin']);
  });
});

describe('safe settings and hierarchy mutations',()=>{
  test('settings expose permissions/features without secrets',async()=>{
    const {deps}=depsFor();
    const r=await handleMonitoringControlApi(req('/api/control/settings'),profiles.super,deps); const body=await r!.json();
    expect(r?.status).toBe(200);
    expect(body.features.dashboardConstructor).toBe(false);
    expect(body.permissions.canManageAdmins).toBe(true);
    const serial=JSON.stringify(body).toLowerCase();
    expect(serial).not.toContain('database_url');
    expect(serial).not.toContain('password');
    expect(serial).not.toContain('jwt');
  });

  test('only Super Admin can mutate hierarchy',async()=>{
    const input={institutionId:'gij-op',parentId:'gij-ttb',scope:"G'ijduvon"};
    const s=depsFor();const sr=await handleMonitoringControlApi(req('/api/control/hierarchy','POST',input),profiles.super,s.deps);
    expect(sr?.status).toBe(200);expect(s.calls[0]?.[0]).toBe('hierarchy');
    const d=depsFor();const dr=await handleMonitoringControlApi(req('/api/control/hierarchy','POST',input),profiles.district,d.deps);
    expect(dr?.status).toBe(403);expect(d.calls).toEqual([]);
  });
});
