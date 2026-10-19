# Production HA & Security Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing Buxoro SSB production application for multi-replica operation by adding Redis-backed distributed protection, stricter session/request security, health/readiness behavior, CI gates, and verified Railway runtime settings without performing destructive database migration.

**Architecture:** Keep the existing Bun application and Postgres schema as the source of truth. Add a small Redis-backed security boundary used by every app replica for shared counters and throttling, integrate it in the existing `super-admin-wrapper.ts` request pipeline, and keep authorization server-side in the existing RBAC modules. Railway remains the runtime platform; this phase moves the app to 3 replicas and verifies health/tracing/zero-downtime behavior while leaving Postgres HA, Cloudflare/WAF, and secondary-provider DR to later plans.

**Tech Stack:** Bun 1.2.23, TypeScript, Bun test, `postgres` 3.4.x, Railway, Redis-compatible service, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-19-production-ha-security-design.md`

## Global Constraints

- Do not delete or replace the current production Postgres service or `postgres-volume` in this phase.
- Do not expose Postgres or Redis through a public TCP proxy.
- Public application target: 3 replicas, restart policy `ALWAYS`, deployment overlap preserved, draining preserved.
- Login abuse policy: 5 failed attempts per account within 10 minutes triggers temporary blocking/challenge behavior.
- Admin/control API initial limit: 60 requests/minute per authenticated user.
- Public API initial limit: 120 requests/minute per IP.
- State-changing browser requests require CSRF/origin protection; GET/HEAD must not mutate state.
- Sensitive responses must use `cache-control: no-store`.
- Secrets, raw session tokens, plaintext passwords, DB credentials, and Redis credentials must never be committed or logged.
- Existing RBAC remains authoritative; UI visibility is never treated as authorization.
- `bun test` must pass before any production deployment is considered acceptable.

## Review Focus

- Redis is unavailable or slow: public reads continue where safe, but login/admin mutation protection must not silently disappear.
- Multiple replicas receive the same abusive login/API traffic: counters must be shared and consistent across replicas.
- Requests with missing/forged Origin/Referer attempt POST/PUT/PATCH/DELETE to privileged APIs: requests are rejected without breaking same-origin legitimate traffic.
- Role/scope is reduced while a privileged session is active: that session must no longer retain broader authorization.
- Oversized/malformed request bodies: rejected before expensive downstream processing and never echoed with secrets.

---

## Scope decomposition

This is **Phase 1** of the approved design. Separate implementation plans will cover:

1. **Phase 2 — Database HA and tested backup/restore:** backup worker, restore drill, HA Postgres topology, controlled cutover.
2. **Phase 3 — Edge/WAF:** Cloudflare/WAF, origin hardening, edge TLS/rate-limit/bot rules.
3. **Phase 4 — Disaster recovery:** secondary-provider standby, failover/failback drill, measured RTO/RPO.

Phase 1 must leave the production database untouched except for additive/idempotent schema changes already required by security/audit features.

---

### Task 1: Add a production security CI gate

**Files:**
- Create: `.github/workflows/production-security.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `bun test` test suite.
- Produces: a CI job that blocks a green status unless tests pass; package scripts `test` and `test:security` remain Bun-based.

- [ ] **Step 1: Add a failing contract test for CI-required security suites**

Create `tests/production-security-ci.test.ts` that reads `.github/workflows/production-security.yml` and asserts it runs `bun test`, includes `tests/rbac-store.test.ts`, `tests/admin-monitor-store.test.ts`, `tests/super-admin-api.test.ts`, and does not print environment variables.

- [ ] **Step 2: Run the new test and verify it fails**

Run: `bun test tests/production-security-ci.test.ts`

Expected: FAIL because the workflow does not yet exist.

- [ ] **Step 3: Create `.github/workflows/production-security.yml`**

Use `actions/checkout`, install the repository-declared Bun version, install dependencies without echoing secrets, and run the full Bun test suite. Keep permissions read-only unless a later job proves write permission is necessary.

- [ ] **Step 4: Add `test:security` to `package.json`**

`test:security` must run the focused RBAC/session/admin/security tests without changing the existing `test: bun test` script.

- [ ] **Step 5: Verify**

Run: `bun test tests/production-security-ci.test.ts && bun test`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `ci: add production security gate`

---

### Task 2: Introduce isolated security policy primitives

**Files:**
- Create: `security-policy.ts`
- Create: `tests/security-policy.test.ts`

**Interfaces:**
- Produces:
  - `classifyRequest(request: Request): 'login'|'admin'|'public'|'other'`
  - `requestIdentity(request: Request, sessionUsername?: string|null): { ipKey:string; userKey:string|null }`
  - `checkSameOrigin(request: Request, allowedOrigins: string[]): { ok:true } | { ok:false; reason:string }`
  - `bodyLimitFor(pathname: string): number`
  - constants for login/admin/public limits from the approved spec.

- [ ] **Step 1: Write failing policy tests**

Cover exact limits (5 attempts/10 minutes, 60/minute admin, 120/minute public), state-changing same-origin rejection, safe handling of absent forwarded IP, and bounded body sizes for control endpoints.

- [ ] **Step 2: Run and verify failure**

Run: `bun test tests/security-policy.test.ts`

Expected: FAIL because `security-policy.ts` does not exist.

- [ ] **Step 3: Implement the exported policy helpers**

Keep the module pure: no DB, Redis, Railway, or global mutable state.

- [ ] **Step 4: Run and verify pass**

Run: `bun test tests/security-policy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add security policy primitives`

---

### Task 3: Add distributed Redis security counters with explicit degradation rules

**Files:**
- Create: `redis-security-store.ts`
- Create: `tests/redis-security-store.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `security-policy.ts` limits.
- Produces:
  - `createSecurityStore(redisUrl: string | undefined): SecurityStore`
  - `SecurityStore.hit(key:string, limit:number, windowSeconds:number): Promise<{allowed:boolean;remaining:number;retryAfterSeconds:number}>`
  - `SecurityStore.reset(key:string): Promise<void>`
  - `SecurityStore.health(): Promise<{configured:boolean;ok:boolean}>`
- Degradation rule: login/admin mutation protection must return an explicit unavailable result when Redis cannot be reached; public read throttling may fail open, but only through a caller-visible result that can be logged/metriced.

- [ ] **Step 1: Write failing tests using a fake Redis adapter**

Tests must prove counters are shared through the adapter, TTL/window behavior is respected, secrets are not part of logged keys, and Redis failure produces the documented degradation result instead of throwing through the request loop.

- [ ] **Step 2: Run and verify failure**

Run: `bun test tests/redis-security-store.test.ts`

Expected: FAIL.

- [ ] **Step 3: Add one Redis client dependency and implement the store**

Use a single maintained Redis client library compatible with Bun. Read only `REDIS_URL`; never log the rendered URL.

- [ ] **Step 4: Run and verify pass**

Run: `bun test tests/redis-security-store.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add distributed security counters`

---

### Task 4: Enforce rate limits, CSRF/origin checks, request-size limits, and safe headers in the request pipeline

**Files:**
- Modify: `super-admin-wrapper.ts`
- Modify: `super-admin-api.ts`
- Modify: `admin-account-management.ts`
- Create: `tests/security-boundary.test.ts`
- Modify: `tests/super-admin-api.test.ts`

**Interfaces:**
- Consumes: `security-policy.ts`, `redis-security-store.ts`, existing `createSessionHash`, existing RBAC handlers.
- Produces: a single request boundary before privileged handlers run.

- [ ] **Step 1: Write failing boundary tests**

Tests must assert:
- 61st admin request in one minute is `429`.
- Repeated login failures reach the 5/10-minute threshold across the shared store.
- Cross-origin POST to `/api/control/*` is `403`.
- Same-origin valid POST remains functional.
- Oversized JSON is `413` before forwarding.
- Redis-unavailable login/admin mutation returns controlled `503` or equivalent explicit protection-unavailable response rather than bypassing security.
- Security responses contain no raw token/password/secret values.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `bun test tests/security-boundary.test.ts tests/super-admin-api.test.ts`

Expected: FAIL on the new assertions.

- [ ] **Step 3: Integrate the security boundary in `super-admin-wrapper.ts`**

Order: parse request metadata → body-size guard → same-origin/CSRF guard for state-changing privileged requests → shared rate-limit decision → revoked-session check → existing control/RBAC handler.

- [ ] **Step 4: Add consistent response security headers**

For authenticated/admin/control responses ensure `cache-control: no-store`, `x-content-type-options: nosniff`, frame restriction compatible with the existing CSP, and referrer policy. Do not overwrite a stricter CSP already generated by the legacy application.

- [ ] **Step 5: Preserve server-side authorization**

No rate-limit or CSRF helper may authorize an operation; `super-admin-api.ts` and `admin-account-management.ts` continue to enforce role/scope checks.

- [ ] **Step 6: Run focused and full tests**

Run: `bun test tests/security-boundary.test.ts tests/super-admin-api.test.ts tests/admin-account-management.test.ts tests/super-admin-style-csp.test.ts && bun test`

Expected: PASS.

- [ ] **Step 7: Commit**

Commit message: `feat: enforce production request security boundary`

---

### Task 5: Invalidate privileged sessions after account/scope security changes

**Files:**
- Modify: `admin-monitor-store.ts`
- Modify: `rbac-store.ts`
- Modify: `super-admin-wrapper.ts`
- Modify: `admin-account-management.ts`
- Modify: `tests/admin-monitor-store.test.ts`
- Modify: `tests/rbac-store.test.ts`
- Modify: `tests/admin-account-management.test.ts`

**Interfaces:**
- Produces:
  - `revokeUserSessions(sql, username, actorUsername, reason): Promise<number>`
  - audit action identifying why sessions were invalidated.

- [ ] **Step 1: Write failing tests**

Prove that disabling an admin, reducing scope/role, and resetting a privileged credential revoke active sessions for that username; unrelated users remain active; only session hashes are stored/audited.

- [ ] **Step 2: Run and verify failure**

Run: `bun test tests/admin-monitor-store.test.ts tests/rbac-store.test.ts tests/admin-account-management.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement user-session revocation**

Use the existing `app_session_presence` and `app_revoked_sessions` tables. Insert revocations by session hash; never persist raw tokens.

- [ ] **Step 4: Wire revocation into security-sensitive account/profile changes**

After successful password reset, deactivation, or privilege reduction, revoke the target user's active sessions and append an audit event.

- [ ] **Step 5: Verify**

Run: `bun test tests/admin-monitor-store.test.ts tests/rbac-store.test.ts tests/admin-account-management.test.ts && bun test`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: revoke sessions after privilege changes`

---

### Task 6: Separate liveness, readiness, and dependency health

**Files:**
- Modify: `monitoring-route-wrapper.ts`
- Modify: `super-admin-wrapper.ts`
- Create: `tests/health-routes.test.ts`

**Interfaces:**
- Produces public/internal HTTP contracts:
  - `GET /health` → process liveness only, fast, no secret data.
  - `GET /ready` → readiness; verifies DB and Redis dependency state with short timeouts.
  - existing `/api/control/health` remains authenticated monitoring data and must not expose secrets.

- [ ] **Step 1: Write failing health-route tests**

Assert `/health` stays 200 when Redis is degraded, `/ready` reports non-ready when required dependencies cannot safely serve mutations, and no health endpoint returns connection strings, passwords, JWT/session secrets, or raw stack traces.

- [ ] **Step 2: Run and verify failure**

Run: `bun test tests/health-routes.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement the routes with bounded dependency timeouts**

Do not let `/health` perform DB/Redis network calls. `/ready` must finish quickly and return structured status without credentials.

- [ ] **Step 4: Run and verify pass**

Run: `bun test tests/health-routes.test.ts tests/super-admin-api.test.ts && bun test`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add liveness and readiness endpoints`

---

### Task 7: Railway Phase 1 infrastructure rollout

**Files:**
- No destructive repository file changes required beyond prior tasks.
- Railway production services/config are changed only after code tests pass.

**Interfaces:**
- Consumes: `/health`, `/ready`, `REDIS_URL`, existing `DATABASE_URL`.
- Produces: 3 healthy app replicas, private Redis, tracing enabled, healthcheck bound to `/health`, no public DB/Redis TCP proxy.

- [ ] **Step 1: Verify current production state before changing it**

Confirm `buxoro-3d-dashboard`, `Postgres`, `postgres-volume`, `ops-health-monitor`, and `security-header-monitor`; record current deployment IDs and rollback target.

- [ ] **Step 2: Provision Redis as a private Railway service**

Do not create a public domain or TCP proxy. Connect the application using a Railway reference variable for `REDIS_URL` rather than copying credentials into Git.

- [ ] **Step 3: Deploy the tested code and verify one replica first**

Verify `/health`, `/ready`, login, admin RBAC, and Redis-backed limits before increasing capacity.

- [ ] **Step 4: Scale `buxoro-3d-dashboard` to 3 replicas**

Keep `restartPolicy=ALWAYS`; preserve overlap/draining and tracing settings.

- [ ] **Step 5: Verify live runtime behavior**

Check all 3 replicas healthy, error rate, latency, CPU/RAM, and logs. Confirm Postgres and Redis have no public TCP proxy.

- [ ] **Step 6: Failure drill**

Restart/terminate one application replica only and verify the public site remains available. Do not restart Postgres for this test.

- [ ] **Step 7: Redis degradation drill**

Temporarily test dependency unavailability using a controlled non-destructive method; verify reads degrade as designed and protected mutations do not silently bypass controls.

- [ ] **Step 8: Record evidence**

Add a short operational note under `docs/operations/` with deployment IDs, test timestamps, observed RTO for single-replica failure, and any deviations from the target.

- [ ] **Step 9: Commit operational evidence**

Commit message: `docs: record phase 1 production hardening verification`

---

### Task 8: Remove the old runtime probe only after CI covers it

**Files:**
- Inspect/migrate logic from Railway `rbac-source-contract-probe` into repository tests or `.github/workflows/production-security.yml`.

**Interfaces:**
- Produces: equivalent contract coverage in CI before the Railway probe is deleted.

- [ ] **Step 1: Read the deployed Railway Function source**

List each check it performs and map every check to an existing/new repository test.

- [ ] **Step 2: Add any missing contract tests and verify they fail before implementation**

Run the focused tests and confirm the new coverage is real.

- [ ] **Step 3: Make the CI workflow run those tests**

Run: `bun test && bun test:security` (or the exact scripts defined in Task 1).

Expected: PASS.

- [ ] **Step 4: Delete `rbac-source-contract-probe` from Railway only after the equivalent CI checks are green**

Do not delete any database or volume.

- [ ] **Step 5: Verify production inventory and health**

Expected Phase 1 runtime inventory: public app, Postgres, private Redis, health/security monitors; no obsolete contract-probe service.

---

## Phase 1 acceptance checks

- 3 app replicas are healthy.
- One replica can fail without taking the site down beyond the measured target window.
- Distributed login/admin/public limits behave consistently across replicas.
- State-changing cross-origin requests are rejected.
- Oversized privileged requests are rejected early.
- Active privileged sessions are revoked after deactivation/password reset/privilege reduction.
- `/health` and `/ready` have separate semantics and expose no secrets.
- CI runs the full test suite and focused security tests.
- Redis and Postgres have no public TCP proxy.
- `rbac-source-contract-probe` is removed only if its checks are proven in CI.
- Full `bun test` passes at the end.

## Deferred to later plans

- Postgres primary/replica HA migration and controlled cutover.
- Hourly logical backup worker, offsite encrypted copies, monthly restore drill.
- Cloudflare/WAF/DDoS/bot/origin-hardening configuration.
- Secondary-provider standby and provider-level DNS/edge failover.
