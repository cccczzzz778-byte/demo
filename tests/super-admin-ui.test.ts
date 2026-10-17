import { describe, expect, test } from 'bun:test';
import { renderAdminShell } from '../super-admin-ui.ts';
import type { AccessProfile } from '../rbac.ts';
const superP:AccessProfile={username:'admin',role:'SUPER_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:null,active:true};
const viewer:AccessProfile={username:'v',role:'CONTROL_ADMIN',scopeType:'province',districtId:null,facilityId:null,controlMode:'viewer',active:true};

describe('Super Admin UI',()=>{
 test('renders all 11 menu labels, nonce placeholder and mobile drawer',()=>{
   const h=renderAdminShell(superP);for(const x of ['Bosh sahifa','Adminlar','Foydalanuvchilar','Muassasalar','Hududlar va iyerarxiya','3D xarita','Sessiyalar','Xavfsizlik','Audit','Server holati','Sozlamalar'])expect(h).toContain(x);
   expect(h).toContain('__CSP_NONCE__');expect(h).toContain('mobile-menu');expect(h).toContain('data-admin-create');expect(h).toContain('data-session-revoke');
 });
 test('viewer UI stays read-only and never contains dashboard constructor or secrets',()=>{
   const h=renderAdminShell(viewer);expect(h).not.toContain('data-admin-create');expect(h).not.toContain('data-credential-create');expect(h).not.toContain('data-session-revoke');expect(h).not.toMatch(/dashboard constructor|DATABASE_URL|JWT_SECRET|password_hash/i);
 });
 test('browser code calls only scoped control APIs for management data',()=>{
   const h=renderAdminShell(superP);const paths=[...h.matchAll(/fetch\(['"]([^'"]+)/g)].map(x=>x[1]);expect(paths.length).toBeGreaterThan(2);expect(paths.every(x=>x.startsWith('/api/control/'))).toBe(true);
 });
 test('includes read-only facility preview affordance without impersonation write identity',()=>{
   const h=renderAdminShell(superP);expect(h).toContain('Muassasa sifatida ko‘rish');expect(h).toContain('READ ONLY');expect(h).not.toContain('impersonate');
 });
});
