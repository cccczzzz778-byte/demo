# RBAC and Credential Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce one Super Admin, scoped Admin/Control Admin roles, and server-side credential permissions without breaking the existing login, facility, security-header, and mobile-login flows.

**Architecture:** Add a small RBAC layer outside the compressed base app. Store role/scope metadata in companion Postgres tables rather than mutating unknown legacy columns. Reuse the existing authenticated session and legacy user-management operations through a narrow adapter so password hashing stays owned by the base app.

**Tech Stack:** Bun 1.2.23, TypeScript ES modules, `postgres` 3.4.x, Bun test runner, existing wrapper chain.

**Spec:** `docs/superpowers/specs/2026-10-17-super-admin-rbac-3d-design.md`

## Global Constraints

- Exactly one `SUPER_ADMIN` may exist.
- `ADMIN` is bound to exactly one district/city.
- `CONTROL_ADMIN` supports `province|district` scope and `active|viewer` mode.
- DPM credentials may be created/reset only by `SUPER_ADMIN`.
- Facility users may not manage credentials or other users.
- Authorization is enforced at API level, not only in UI.
- Existing `/login`, `/leadership`, `/admin`, `/facility`, security headers, rate limiting, mobile same-origin fix, and existing DB data must keep working.
- Passwords/hashes must never be written to audit logs or normal logs.
- DB migration must be idempotent and must inspect legacy schema before relying on it.

## Review Focus

- Missing or stale access-profile row: default deny for admin mutations; existing facility usage must continue.
- District-name aliases (`Buxoro` vs `Buxoro shahri`, `Kogon` vs `Kogon shahri`) must not allow scope escape.
- A `CONTROL_ADMIN viewer` must receive 403 for every mutation even when province-scoped.
- DPM detection must remain correct when a facility has no district field or is marked viloyat-level.
- A second `SUPER_ADMIN` insertion/update must fail atomically.

---

### Task 1: Freeze the legacy auth and user-management contract

**Files:**
- Create: `legacy-admin-contract.ts`
- Create: `tests/legacy-admin-contract.test.ts`
- Read only: `index.ts`, `parts/0.txt` … `parts/6.txt`, `wrapper.ts`, `mobile-wrapper.ts`

**Interfaces:**
- Produces: `LegacyAdminContract` with the exact authenticated-user endpoint and exact existing create/reset/activate user endpoints discovered from the current base source.
- Produces: `normalizeLegacyActor(payload: unknown): LegacyActor | null`.

- [ ] **Step 1: Write the failing contract test**

Assert that `LegacyAdminContract` exposes non-empty exact paths for `me`, `listUsers`, `createUser`, `resetUser`, and `setUserActive`, and that `normalizeLegacyActor()` rejects malformed payloads.

- [ ] **Step 2: Run the test and verify RED**

Run: `bun test tests/legacy-admin-contract.test.ts`
Expected: FAIL because the contract module does not exist.

- [ ] **Step 3: Decode/read the current embedded base source and implement `legacy-admin-contract.ts`**

Do not guess endpoint names. Pin the exact current paths and the minimum actor fields actually returned by the authenticated-user endpoint.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `bun test tests/legacy-admin-contract.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add legacy-admin-contract.ts tests/legacy-admin-contract.test.ts && git commit -m "test: pin legacy admin API contract"`

### Task 2: Define RBAC types and authorization rules

**Files:**
- Create: `rbac.ts`
- Create: `tests/rbac.test.ts`

**Interfaces:**
- Produces: `AccessProfile`, `AccessRole`, `ScopeType`, `ControlMode`, `ResourceScope`, `RbacAction`.
- Produces: `authorize(profile: AccessProfile, action: RbacAction, target: ResourceScope): { allowed: boolean; reason: string }`.
- Produces: `canonicalDistrict(name: string | null): string | null`.

- [ ] **Step 1: Write failing tests for the complete permission matrix**

Cover Super Admin all-scope access; Admin same-district only; Control Admin province/district + active/viewer; DPM restriction; facility denial; district aliases; inactive account denial.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/rbac.test.ts`
Expected: FAIL because `rbac.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure authorization layer**

Use explicit actions such as `VIEW`, `CREATE_CREDENTIAL`, `RESET_CREDENTIAL`, `SET_ACTIVE`, `ASSIGN_ADMIN`, `MANAGE_SESSION`, `MANAGE_HIERARCHY`.

- [ ] **Step 4: Run and verify GREEN**

Run: `bun test tests/rbac.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add rbac.ts tests/rbac.test.ts && git commit -m "feat: add scoped RBAC rules"`

### Task 3: Add idempotent RBAC persistence

**Files:**
- Create: `rbac-store.ts`
- Create: `tests/rbac-store.test.ts`

**Interfaces:**
- Consumes: `AccessProfile` from Task 2.
- Produces: `ensureRbacSchema(sql)`, `getProfile(sql, username)`, `upsertAdminProfile(sql, profile)`, `setProfileActive(sql, username, active)`, `listAdminProfiles(sql)`, `appendAdminAudit(sql, event)`.

- [ ] **Step 1: Write failing persistence tests**

Tests must pin table/constraint behavior: one Super Admin maximum, `ADMIN` requires district scope, `CONTROL_ADMIN viewer|active` validation, idempotent migration, audit payload redaction.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/rbac-store.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement companion tables**

Use `app_access_profiles` keyed by normalized username and `app_admin_audit`; add a partial unique index enforcing one `SUPER_ADMIN`. Do not alter legacy `app_users` columns.

- [ ] **Step 4: Add migration bootstrap for the existing admin**

Map the current base-app admin username to `SUPER_ADMIN` only when no Super Admin profile exists; never delete existing users during this migration.

- [ ] **Step 5: Run and verify GREEN**

Run: `bun test tests/rbac-store.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

`git add rbac-store.ts tests/rbac-store.test.ts && git commit -m "feat: persist admin scopes and audit"`

### Task 4: Build the scoped admin API facade

**Files:**
- Create: `super-admin-api.ts`
- Create: `tests/super-admin-api.test.ts`

**Interfaces:**
- Consumes: Task 1 contract, Task 2 authorization, Task 3 store.
- Produces: `handleAdminApi(request, innerFetch, deps): Promise<Response | null>`.
- Routes owned by this layer start with `/api/control/`.

- [ ] **Step 1: Write failing route tests**

Cover authenticated profile lookup; 401 unauthenticated; 403 out-of-scope; Admin same-district credential action; province active Control Admin non-DPM credential action; viewer mutation denial; all non-Super-Admin DPM mutation denial; Super Admin admin-assignment action.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/super-admin-api.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement actor resolution and scope checks**

Resolve the current authenticated actor by forwarding the original cookie/session to the legacy `me` endpoint through `innerFetch`, then load `app_access_profiles`.

- [ ] **Step 4: Implement the credential facade**

After authorization, delegate create/reset/activate operations to the legacy admin operations from Task 1. Do not implement a second password-hashing scheme.

- [ ] **Step 5: Implement admin assignment endpoints**

Only Super Admin may create/update Admin and Control Admin access profiles. Reject attempts to create another Super Admin.

- [ ] **Step 6: Run and verify GREEN**

Run: `bun test tests/super-admin-api.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

`git add super-admin-api.ts tests/super-admin-api.test.ts && git commit -m "feat: add scoped credential and admin API"`

### Task 5: Integrate the RBAC wrapper without regressing existing wrappers

**Files:**
- Create: `super-admin-wrapper.ts`
- Modify: `package.json`
- Test: `tests/wrapper-chain.test.ts`

**Interfaces:**
- Consumes: `handleAdminApi()` from Task 4.
- Produces: outermost server wrapper; then imports `./district-ux-wrapper.ts`.

- [ ] **Step 1: Write failing wrapper-chain tests**

Assert `/api/control/*` is intercepted, non-control paths pass through untouched, and the import chain remains `super-admin-wrapper -> district-ux-wrapper -> mobile-wrapper -> wrapper -> index`.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/wrapper-chain.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `super-admin-wrapper.ts`**

Wrap `Bun.serve` exactly once for the new API facade; preserve response/security behavior from the inner wrappers.

- [ ] **Step 4: Update package scripts**

Set `start` to `bun super-admin-wrapper.ts` and add `test: bun test` without changing Bun/Postgres versions.

- [ ] **Step 5: Run all tests**

Run: `bun test`
Expected: PASS.

- [ ] **Step 6: Commit**

`git add super-admin-wrapper.ts package.json tests && git commit -m "feat: enforce RBAC through outer wrapper"`

### Task 6: Production RBAC smoke verification

**Files:**
- No product-code changes unless a failing smoke test identifies a defect.

**Interfaces:**
- Verifies Tasks 1–5 in Railway production.

- [ ] **Step 1: Deploy the commit to the existing Railway service**

Wait for `SUCCESS`; do not touch the Postgres service deployment.

- [ ] **Step 2: Verify existing flows**

Expected: login 200 with valid credentials; `/leadership`, `/admin`, `/facility` 200 for authorized session; mobile same-origin login still reaches auth; security headers/rate limit remain present.

- [ ] **Step 3: Verify authorization matrix through HTTP**

Expected: unauthorized 401/403; same-district Admin mutation succeeds; cross-district and DPM mutation denied; viewer mutation denied; Super Admin assignment succeeds.

- [ ] **Step 4: Verify audit**

Expected: credential/admin actions produce audit rows without password/hash values.

- [ ] **Step 5: Commit only if smoke fixes were required**

Use a focused `fix:` commit and rerun `bun test` plus the smoke checks.
