import { describe, expect, test } from 'bun:test';
import { handleAdminApi, type AdminApiDeps, type ManagedInstitution, type ManagedUser } from '../super-admin-api';
import type { AccessProfile } from '../rbac';
import type { LegacyActor } from '../legacy-admin-contract';

const actor: LegacyActor = { id:'legacy-1', username:'admin', role:'ADMIN', institutionId:null, scope:null };
const profiles = {
  super: { username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:null,active:true },
  gij: { username:'gij-admin',role:'ADMIN',scopeType:'district',districtId:"G'ijduvon",facilityId:null,controlMode:null,active:true },
  provinceActive: { username:'naz',role:'CONTROL_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:'active',active:true },
  provinceViewer: { username:'naz-view',role:'CONTROL_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:'viewer',active:true },
  facility: { username:'op-user',role:'FACILITY',scopeType:'facility',districtId:"G'ijduvon",facilityId:'op-gij',controlMode:null,active:true },
} satisfies Record<string, AccessProfile>;

const institutions: ManagedInstitution[] = [
  { id:'op-gij', name:'Gijduvon OP', type:'OP', scope:"G'ijduvon", parentId:'ttb-gij' },
  { id:'op-jondor', name:'Jondor OP', type:'OP', scope:'Jondor', parentId:'ttb-jondor' },
  { id:'dpm-1', name:'Viloyat DPM', type:'DPM', scope:'Buxoro shahri', parentId:null },
  { id:'ttb-gij', name:'Gijduvon TTB', type:'TTB', scope:"G'ijduvon", parentId:null },
];
const users: ManagedUser[] = [
  { id:'u-gij',username:'gij-op',role:'DATA_ENTRY',active:true,institutionId:'op-gij',institutionName:'Gijduvon OP',institutionType:'OP',scope:"G'ijduvon" },
  { id:'u-jondor',username:'jondor-op',role:'DATA_ENTRY',active:true,institutionId:'op-jondor',institutionName:'Jondor OP',institutionType:'OP',scope:'Jondor' },
  { id:'u-dpm',username:'dpm',role:'DATA_ENTRY',active:true,institutionId:'dpm-1',institutionName:'Viloyat DPM',institutionType:'DPM',scope:'Buxoro shahri' },
];

function makeDeps(profile: AccessProfile | null) {
  const calls: any[] = [];
  const deps: AdminApiDeps = {
    resolveActor: async () => profile ? { actor:{...actor,username:profile.username}, profile } : null,
    findInstitution: async id => institutions.find(x=>x.id===id) ?? null,
    findUser: async id => users.find(x=>x.id===id) ?? null,
    listInstitutions: async () => institutions,
    listUsers: async () => users,
    listAdmins: async () => [],
    createManagedAdmin: async input => { calls.push(['createAdmin',input]); return { username:input.username, role:input.role }; },
    resetManagedAdmin: async (username,password) => { calls.push(['resetAdmin',username,password]); return true; },
    setManagedAdminActive: async (username,active) => { calls.push(['statusAdmin',username,active]); return true; },
    audit: async event => { calls.push(['audit',event]); },
  };
  return { deps, calls };
}

function request(path: string, method='GET', body?: unknown) {
  return new Request('https://example.test'+path, {
    method,
    headers: body === undefined ? {} : {'content-type':'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function innerRecorder(status=201) {
  const calls: { url:string; method:string; body:any }[] = [];
  const inner = async (req: Request) => {
    let body:any=null; try{ body=await req.clone().json(); }catch{}
    calls.push({url:new URL(req.url).pathname,method:req.method,body});
    return new Response(JSON.stringify({ok:true,id:'created',username:body?.username}),{status,headers:{'content-type':'application/json'}});
  };
  return { inner, calls };
}

describe('handleAdminApi authentication and scope', () => {
  test('returns 401 for unauthenticated control requests', async () => {
    const {deps}=makeDeps(null); const rec=innerRecorder();
    const res=await handleAdminApi(request('/api/control/users'),rec.inner,deps);
    expect(res?.status).toBe(401);
    expect(rec.calls.length).toBe(0);
  });

  test('ordinary Admin may create/reset only same-district non-DPM credentials', async () => {
    const {deps}=makeDeps(profiles.gij); const rec=innerRecorder();
    const ok=await handleAdminApi(request('/api/control/credentials','POST',{institutionId:'op-gij',username:'new-op',password:'StrongPass9!'}),rec.inner,deps);
    expect(ok?.status).toBe(201);
    expect(rec.calls[0]?.url).toBe('/api/v1/admin/users');
    expect(rec.calls[0]?.body).toEqual({institutionId:'op-gij',role:'DATA_ENTRY',username:'new-op',password:'StrongPass9!'});

    const cross=await handleAdminApi(request('/api/control/credentials','POST',{institutionId:'op-jondor',username:'x',password:'StrongPass9!'}),rec.inner,deps);
    expect(cross?.status).toBe(403);
    const dpm=await handleAdminApi(request('/api/control/credentials','POST',{institutionId:'dpm-1',username:'x',password:'StrongPass9!'}),rec.inner,deps);
    expect(dpm?.status).toBe(403);

    const reset=await handleAdminApi(request('/api/control/users/u-gij/reset','POST',{password:'ResetPass9!'}),rec.inner,deps);
    expect(reset?.status).toBe(201);
    expect(rec.calls.at(-1)?.url).toBe('/api/v1/admin/users/u-gij/reset');
  });

  test('province active Control Admin manages non-DPM credentials, viewer cannot mutate, and neither may mutate DPM', async () => {
    const active=makeDeps(profiles.provinceActive); const rec=innerRecorder();
    expect((await handleAdminApi(request('/api/control/credentials','POST',{institutionId:'op-jondor',username:'x',password:'StrongPass9!'}),rec.inner,active.deps))?.status).toBe(201);
    expect((await handleAdminApi(request('/api/control/credentials','POST',{institutionId:'dpm-1',username:'x',password:'StrongPass9!'}),rec.inner,active.deps))?.status).toBe(403);
    const viewer=makeDeps(profiles.provinceViewer);
    expect((await handleAdminApi(request('/api/control/users/u-jondor/status','POST',{active:false}),rec.inner,viewer.deps))?.status).toBe(403);
  });

  test('facility users cannot access credential mutations', async () => {
    const {deps}=makeDeps(profiles.facility); const rec=innerRecorder();
    expect((await handleAdminApi(request('/api/control/credentials','POST',{institutionId:'op-gij',username:'x',password:'StrongPass9!'}),rec.inner,deps))?.status).toBe(403);
  });
});

describe('admin assignment', () => {
  test('only Super Admin can appoint an ordinary/control admin', async () => {
    const payload={username:'olot-admin',password:'StrongPass9!',role:'ADMIN' as const,scopeType:'district' as const,districtId:'Olot',controlMode:null};
    const s=makeDeps(profiles.super); const rec=innerRecorder();
    const ok=await handleAdminApi(request('/api/control/admins','POST',payload),rec.inner,s.deps);
    expect(ok?.status).toBe(201);
    expect(s.calls[0]?.[0]).toBe('createAdmin');
    const ordinary=makeDeps(profiles.gij);
    expect((await handleAdminApi(request('/api/control/admins','POST',payload),rec.inner,ordinary.deps))?.status).toBe(403);
  });
});

describe('legacy bypass protection', () => {
  test('intercepts legacy admin mutation endpoints with the same RBAC checks', async () => {
    const {deps}=makeDeps(profiles.gij); const rec=innerRecorder();
    const cross=await handleAdminApi(request('/api/v1/admin/users','POST',{institutionId:'op-jondor',role:'DATA_ENTRY',username:'x',password:'StrongPass9!'}),rec.inner,deps);
    expect(cross?.status).toBe(403);
    expect(rec.calls.length).toBe(0);
  });

  test('blocks institution-side region credential issuance/reset entirely', async () => {
    const {deps}=makeDeps(profiles.facility); const rec=innerRecorder();
    const create=await handleAdminApi(request('/api/v1/region/users','POST',{institutionId:'op-gij',username:'x',password:'StrongPass9!'}),rec.inner,deps);
    const reset=await handleAdminApi(request('/api/v1/region/users/u-gij/reset','POST',{password:'StrongPass9!'}),rec.inner,deps);
    expect(create?.status).toBe(403);
    expect(reset?.status).toBe(403);
    expect(rec.calls.length).toBe(0);
  });
});

describe('scoped lists', () => {
  test('ordinary Admin sees only its district users/institutions; province viewer may see DPM read-only', async () => {
    const a=makeDeps(profiles.gij); const rec=innerRecorder(200);
    const ur=await handleAdminApi(request('/api/control/users'),rec.inner,a.deps); const ud=await ur!.json();
    expect(ud.users.map((x:any)=>x.id)).toEqual(['u-gij']);
    const ir=await handleAdminApi(request('/api/control/institutions'),rec.inner,a.deps); const id=await ir!.json();
    expect(id.institutions.map((x:any)=>x.id).sort()).toEqual(['op-gij','ttb-gij'].sort());

    const v=makeDeps(profiles.provinceViewer);
    const vr=await handleAdminApi(request('/api/control/institutions'),rec.inner,v.deps); const vd=await vr!.json();
    expect(vd.institutions.some((x:any)=>x.id==='dpm-1')).toBe(true);
  });
});
