# Super Admin UI and Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/admin` into a left-sidebar control center for the single Super Admin while exposing correctly scoped views/actions to ordinary Admin and Control Admin accounts.

**Architecture:** Build the new admin UI as a server-rendered HTML replacement in the outer wrapper, backed only by `/api/control/*` endpoints from the RBAC plan. Add companion presence/revocation/request-metric storage instead of rewriting the compressed base app. Keep dashboard content construction out of scope: this plan manages users, institutions, hierarchy, sessions, security, audit, health, and settings only.

**Tech Stack:** Bun 1.2.23, TypeScript, Postgres via `postgres`, browser-native HTML/CSS/JS, Bun test runner.

**Spec:** `docs/superpowers/specs/2026-10-17-super-admin-rbac-3d-design.md`

**Depends on:** `docs/superpowers/plans/2026-10-17-rbac-credential-plan.md`

## Global Constraints

- The sidebar sections are: Bosh sahifa, Adminlar, Foydalanuvchilar, Muassasalar, Hududlar va iyerarxiya, 3D xarita, Sessiyalar, Xavfsizlik, Audit, Server holati, Sozlamalar.
- Only Super Admin may assign Admin/Control Admin roles, terminate arbitrary sessions, or manage DPM credentials.
- Ordinary Admin sees only one assigned district/city.
- Control Admin obeys province/district scope and active/viewer mode.
- Province Control Admin may monitor DPMs but never manage DPM credentials.
- Password/hash values are never returned in UI/API/audit.
- Existing security headers/CSP must remain valid; no inline script that violates the current nonce policy.
- No dashboard-layout/content constructor is added in this phase.

## Review Focus

- A stale browser tab after a role/scope change must receive 403 from the server even if the old menu is still visible.
- Search/filter parameters must not broaden scope; scope filtering occurs before user-provided filters.
- Session identifiers shown to the UI must be opaque hashes, never raw auth cookies/tokens.
- Server-health endpoints must not expose DB URLs, Railway secrets, JWT secrets, or environment-variable values.
- Mobile layout must keep the sidebar usable without covering the primary content permanently.

---

### Task 1: Add presence, session-revocation, and request-metric storage

**Files:**
- Create: `admin-monitor-store.ts`
- Create: `tests/admin-monitor-store.test.ts`
- Modify: `super-admin-wrapper.ts`

**Interfaces:**
- Produces: `ensureMonitorSchema(sql)`, `touchPresence(sql, actor, requestMeta)`, `listPresence(sql, scope)`, `revokeSession(sql, sessionHash, actor)`, `isSessionRevoked(sql, sessionHash)`, `recordHttpResult(status, durationMs)`, `getRuntimeMetrics()`.
- Consumes authenticated actor/session information from the RBAC layer.

- [ ] **Step 1: Write failing store tests**

Pin opaque SHA-256 session hashes, last-seen/device/browser metadata, Super-Admin-only revocation audit shape, idempotent schema creation, and request-count/5xx aggregation.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/admin-monitor-store.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement companion tables and in-process metrics**

Use `app_session_presence` and `app_revoked_sessions`. Store only hashed session identifiers and coarse user-agent metadata.

- [ ] **Step 4: Integrate presence/revocation checks in the outer wrapper**

For authenticated requests, reject a revoked session before delegating to the base app. Presence updates must be throttled so every static/request hit does not write to Postgres.

- [ ] **Step 5: Run and verify GREEN**

Run: `bun test tests/admin-monitor-store.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

`git add admin-monitor-store.ts super-admin-wrapper.ts tests/admin-monitor-store.test.ts && git commit -m "feat: track admin presence sessions and runtime metrics"`

### Task 2: Freeze institution/hierarchy access and add scoped admin data APIs

**Files:**
- Create: `institution-adapter.ts`
- Create: `tests/institution-adapter.test.ts`
- Modify: `super-admin-api.ts`
- Modify: `tests/super-admin-api.test.ts`

**Interfaces:**
- Produces: `listInstitutions(innerFetch|sql)`, `getInstitutionScope(id)`, `listHierarchy(scope)` using the exact current legacy institution contract/schema discovered from the running source.
- Extends `/api/control/` with `summary`, `admins`, `users`, `institutions`, `hierarchy`, `sessions`, `security-events`, `audit`, `health`, `settings` read endpoints and approved mutation endpoints.

- [ ] **Step 1: Write failing institution-contract tests**

Assert DPM classification, TTB/SHTB -> OP/OShP parentage, city/district normalization, and no unscoped fallback when metadata is incomplete.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/institution-adapter.test.ts tests/super-admin-api.test.ts`
Expected: FAIL.

- [ ] **Step 3: Inspect/pin the existing institution contract and implement adapter**

Do not guess legacy column names or endpoints. DPM must be represented as province-level, outside district hierarchy.

- [ ] **Step 4: Implement scoped read APIs**

Apply RBAC scope before search/filter/sort. Province Control Admin can see DPM rows; district Admin/Control Admin cannot.

- [ ] **Step 5: Implement session/security/audit/health APIs**

`health` returns only safe fields: app up/down, DB ping, current deployment id if provided by Railway, process memory/CPU snapshot, request total, 5xx count/rate. Security data comes from existing `app_security_events`; audit from `app_admin_audit`.

- [ ] **Step 6: Implement hierarchy correction endpoint**

Only Super Admin may alter province-level/DPM placement; district Admin mutation must stay inside its district. Every change is audited.

- [ ] **Step 7: Run and verify GREEN**

Run: `bun test tests/institution-adapter.test.ts tests/super-admin-api.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

`git add institution-adapter.ts super-admin-api.ts tests && git commit -m "feat: expose scoped admin monitoring APIs"`

### Task 3: Build the left-sidebar admin application

**Files:**
- Create: `super-admin-ui.ts`
- Create: `tests/super-admin-ui.test.ts`

**Interfaces:**
- Produces: `renderAdminShell(profile: AccessProfile): string`.
- Produces browser module code that calls only `/api/control/*` and never embeds credentials/secrets.

- [ ] **Step 1: Write failing shell tests**

Assert all 11 menu labels for Super Admin; role-aware hiding/disable behavior; mobile drawer markup; no dashboard-constructor controls; no inline secret values; required CSP nonce placeholder.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/super-admin-ui.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the shell and navigation**

Use a fixed desktop sidebar and mobile drawer. Keep the existing dark/navy medical visual language. Main content is one panel at a time; no full-page reload is required for menu switching.

- [ ] **Step 4: Implement Bosh sahifa, Adminlar, Foydalanuvchilar, Muassasalar, Hududlar/iyerarxiya panels**

Forms/buttons are rendered only when the current profile can perform the corresponding action, but server API remains the source of truth.

- [ ] **Step 5: Implement Sessiyalar, Xavfsizlik, Audit, Server holati, Sozlamalar panels**

Session termination button appears only for Super Admin. Server view shows safe health/usage data only.

- [ ] **Step 6: Add “Muassasa sifatida ko‘rish” read-only preview**

Super Admin and permitted monitoring admins may preview a facility dashboard scope without impersonating a writable facility session. No write request may inherit preview identity.

- [ ] **Step 7: Run and verify GREEN**

Run: `bun test tests/super-admin-ui.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

`git add super-admin-ui.ts tests/super-admin-ui.test.ts && git commit -m "feat: add Super Admin control center UI"`

### Task 4: Serve the new UI at `/admin` with CSP/security compatibility

**Files:**
- Modify: `super-admin-wrapper.ts`
- Modify: `tests/wrapper-chain.test.ts`

**Interfaces:**
- Consumes `renderAdminShell()` from Task 3.
- `/admin` response is replaced only after the existing base auth route accepts the session/profile.

- [ ] **Step 1: Write failing integration tests**

Assert unauthenticated `/admin` preserves existing auth behavior; authenticated admin receives new shell; CSP nonce is present; facility user cannot access admin shell; `/login`, `/leadership`, `/facility` remain pass-through.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/wrapper-chain.test.ts`
Expected: FAIL for new UI assertions.

- [ ] **Step 3: Implement HTML replacement in the outer wrapper**

Never weaken current security headers. Keep cache disabled for role-sensitive admin HTML.

- [ ] **Step 4: Run all tests**

Run: `bun test`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add super-admin-wrapper.ts tests/wrapper-chain.test.ts && git commit -m "feat: serve scoped admin control center"`

### Task 5: Production UI/monitoring smoke verification

**Files:**
- No product-code changes unless verification finds a defect.

- [ ] **Step 1: Deploy to the existing Railway app service and wait for SUCCESS**

- [ ] **Step 2: Verify the Super Admin menu and every panel returns data without JS/server errors**

- [ ] **Step 3: Verify ordinary Admin sees only its one district and cannot see DPM/other districts**

- [ ] **Step 4: Verify province Control Admin sees province monitoring + DPM, with mutation capability determined by active/viewer mode**

- [ ] **Step 5: Verify session revoke, audit entries, security events, DB health, request/5xx metrics, and mobile sidebar**

- [ ] **Step 6: Run final regression checks**

Expected: `/login`, `/leadership`, `/admin`, `/facility` healthy; security headers and rate limiting unchanged.
