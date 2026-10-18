# Command Center Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the safe server-side foundation for Command Center 2.0: centralized scope enforcement, deterministic risk signals, data-quality checks, and read-only leadership APIs without breaking the existing dashboard or data flows.

**Architecture:** Keep the existing Node.js/Express/SQLite runtime and gateway. Add small CommonJS modules under `bitiruvchilar-admin/lib/` and wire new read-only endpoints into `canonical-server-v2.js`; existing graduate, medical, import, backup, 3D, and dashboard behavior remains unchanged. All new logic consumes the existing database and canonical hudud naming utilities.

**Tech Stack:** Node.js >=22.13, CommonJS, `node:test`, `node:sqlite`, Express 5.1.0 already present in the project.

**Spec:** `docs/superpowers/specs/2026-10-18-command-center-2-design.md`

## Global Constraints

- Production behavior remains backward-compatible.
- Existing regression tests must continue to pass.
- Leadership is read-only.
- Server-side authorization is mandatory; hiding browser controls is not access control.
- Risk results are deterministic, explainable rule-based signals only.
- Risk and data-quality modules must never directly mutate source records.
- Existing gateway security headers, request limits, session validation, and cross-site protections must not be weakened.
- Public aggregate endpoints must not expose PINFL, phone, diagnosis text, session secrets, credentials, or raw personal rows.
- Derived-module failures must degrade safely and must not make the existing graduate dashboard unavailable.
- No destructive bulk cleanup runs automatically.

## Review Focus

- Unknown or malformed role/scope data must default to least privilege and never broaden access.
- Latin/cyrillic hudud variants must resolve through the existing canonical hudud layer before scope comparison.
- Empty or partially populated graduate rows must produce data-quality/risk flags without crashing aggregation.
- Aggregate endpoints must return zero/empty summaries when scope contains no rows, not cross-scope fallback data.
- Derived service exceptions must return a safe `unavailable` section while the existing dashboard and `/health` remain usable.

---

## File Structure

- Create `bitiruvchilar-admin/lib/access-scope.js` — normalize roles and resolve authorized hudud/institution scope.
- Create `bitiruvchilar-admin/lib/risk-engine.js` — pure deterministic risk rules over graduate records and freshness metadata.
- Create `bitiruvchilar-admin/lib/data-quality-service.js` — pure/read-only issue detection and aggregate counts.
- Create `bitiruvchilar-admin/lib/command-center-service.js` — leadership-safe aggregates and regional summaries built from scoped rows.
- Modify `bitiruvchilar-admin/canonical-server-v2.js` — add authenticated read-only endpoints using the new modules.
- Modify `bitiruvchilar-admin/package.json` — include new modules in `npm run check`.
- Create `bitiruvchilar-admin/test/access-scope.test.js`.
- Create `bitiruvchilar-admin/test/risk-engine.test.js`.
- Create `bitiruvchilar-admin/test/data-quality-service.test.js`.
- Create `bitiruvchilar-admin/test/command-center-service.test.js`.

### Task 1: Centralized Access Scope

**Files:**
- Create: `bitiruvchilar-admin/lib/access-scope.js`
- Test: `bitiruvchilar-admin/test/access-scope.test.js`

**Interfaces:**
- Consumes: `canonicalHudud(value)` from `./graduate-utils`.
- Produces: `normalizeRole(user) -> 'admin'|'leadership'|'ttb_shtb'|'op_oshp'|'none'`; `resolveScope(user) -> { role, all, hudud, institution, readOnly }`; `applyScopeToFilters(scope, filters={}) -> newFilters`; `canWrite(scope) -> boolean`.

- [ ] **Step 1: Write failing role and least-privilege tests**

Add tests asserting:
- admin resolves `{all:true, readOnly:false}`;
- leadership resolves `{all:true, readOnly:true}`;
- `operator` with `hudud='Buxoro shahri'` migrates to the territory-scoped behavior expected for `ttb_shtb` compatibility and canonical hudud;
- `op_oshp` without an institution resolves to no usable institution scope;
- unknown role resolves to `role:'none'`, `all:false`, `readOnly:true`;
- applying a territory scope overwrites a conflicting caller-supplied `hudud` filter;
- applying an institution scope overwrites a conflicting caller-supplied `op_oshp` filter.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd bitiruvchilar-admin && node --test test/access-scope.test.js`
Expected: FAIL because `lib/access-scope.js` does not exist.

- [ ] **Step 3: Implement the access-scope interfaces**

Use canonical hudud normalization for territory comparisons. Treat absent/unknown role fields as `none`; do not infer admin from missing data. Keep legacy `operator` support territory-scoped for backward compatibility.

- [ ] **Step 4: Run focused and full tests**

Run: `cd bitiruvchilar-admin && node --test test/access-scope.test.js && npm test`
Expected: PASS, with all pre-existing tests still green.

- [ ] **Step 5: Commit**

```bash
git add bitiruvchilar-admin/lib/access-scope.js bitiruvchilar-admin/test/access-scope.test.js
git commit -m "feat: centralize command center access scope"
```

### Task 2: Deterministic Risk Engine

**Files:**
- Create: `bitiruvchilar-admin/lib/risk-engine.js`
- Test: `bitiruvchilar-admin/test/risk-engine.test.js`

**Interfaces:**
- Consumes: normalized graduate-like rows with `id`, `hudud`, `employment_status`, `medical_exam_date`, `pinfl`, `fio`, `education_level`, `op_oshp`, `updated_at` where available.
- Produces: `evaluateGraduateRisk(row, options={}) -> Risk[]`; `summarizeRisks(rows, options={}) -> { total, info, warning, critical, byRule, records }`; each Risk has `{ruleId,severity,entityType,entityId,hudud,reason,evidence,computedAt}`.

- [ ] **Step 1: Write failing deterministic rule tests**

Cover at minimum:
- unemployed + missing medical exam produces separate explainable warning signals;
- missing required identity/location fields produces `profile_incomplete`;
- no PINFL does not fabricate a duplicate finding;
- identical inputs with fixed `now` produce identical rule IDs/severity/evidence;
- malformed/partial row returns flags or an empty list but never throws;
- no raw phone/diagnosis/session-like fields appear in risk output evidence.

Use options `{now:'2026-10-18T00:00:00.000Z'}` in deterministic tests.

- [ ] **Step 2: Run focused test and verify failure**

Run: `cd bitiruvchilar-admin && node --test test/risk-engine.test.js`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement pure risk evaluation**

Keep thresholds in a single exported `DEFAULT_RISK_CONFIG` object. V1 rules must be read-only and explainable; do not query or mutate the DB inside `evaluateGraduateRisk`.

- [ ] **Step 4: Run focused and full tests**

Run: `cd bitiruvchilar-admin && node --test test/risk-engine.test.js && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bitiruvchilar-admin/lib/risk-engine.js bitiruvchilar-admin/test/risk-engine.test.js
git commit -m "feat: add deterministic graduate risk engine"
```

### Task 3: Read-Only Data Quality Service

**Files:**
- Create: `bitiruvchilar-admin/lib/data-quality-service.js`
- Test: `bitiruvchilar-admin/test/data-quality-service.test.js`

**Interfaces:**
- Consumes: array of graduate rows already restricted to authorized scope.
- Produces: `inspectDataQuality(rows) -> {total, issueCount, counts, issues}` where issue entries contain only `{type,severity,entityId,hudud,reason}`; `findDuplicatePinflGroups(rows) -> Array<{pinflHashKey,count,entityIds}>` where the raw PINFL value is not returned.

- [ ] **Step 1: Write failing quality tests**

Assert detection for:
- missing PINFL;
- duplicate non-empty PINFL;
- missing/unknown education;
- missing/unknown employment;
- missing hudud;
- missing OP/OShP where applicable;
- contradictory simple employment status inputs where detectable;
- empty array returns all-zero summary;
- output does not include raw PINFL, phone, or diagnosis values.

- [ ] **Step 2: Run focused test and verify failure**

Run: `cd bitiruvchilar-admin && node --test test/data-quality-service.test.js`
Expected: FAIL because module is missing.

- [ ] **Step 3: Implement read-only detection**

Use in-memory grouping over already scoped rows. Never issue UPDATE/DELETE statements and never auto-repair data.

- [ ] **Step 4: Run focused and full tests**

Run: `cd bitiruvchilar-admin && node --test test/data-quality-service.test.js && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bitiruvchilar-admin/lib/data-quality-service.js bitiruvchilar-admin/test/data-quality-service.test.js
git commit -m "feat: add read-only data quality inspection"
```

### Task 4: Command Center Aggregate Service

**Files:**
- Create: `bitiruvchilar-admin/lib/command-center-service.js`
- Test: `bitiruvchilar-admin/test/command-center-service.test.js`

**Interfaces:**
- Consumes: SQLite `db`, authorized scope from Task 1, risk engine from Task 2, quality service from Task 3, existing `buildDashboardSummary(db,hudud)` where useful.
- Produces: `buildCommandCenter(db, scope, options={}) -> {scope,metrics,risks,dataQuality,territories,generatedAt}`; `buildTerritoryDrilldown(db, scope, hudud, options={}) -> same-safe-subset`.

- [ ] **Step 1: Write failing aggregate and privacy tests**

Create an in-memory migrated DB fixture and assert:
- leadership sees all fixture territories;
- territory-scoped user sees only its canonical territory;
- institution-scoped user sees only its OP/OShP rows;
- caller cannot request another territory to broaden its scope;
- no rows returns zero metrics and empty arrays;
- returned JSON contains no `pinfl`, `telefon`, raw `diagnosis`, password/session/secret-like keys;
- one malformed source row does not crash the whole summary;
- if risk or quality calculation is forced to throw through injected option callbacks, service returns an `unavailable` marker for that derived section while base metrics remain available.

- [ ] **Step 2: Run focused test and verify failure**

Run: `cd bitiruvchilar-admin && node --test test/command-center-service.test.js`
Expected: FAIL because module is missing.

- [ ] **Step 3: Implement safe scoped aggregation**

Read rows only after server-side scope is resolved. Aggregate employment, higher/non-higher education, medical-exam coverage, active risk counts, and 13-territory summaries where authorized. Do not return raw graduate rows from these functions.

- [ ] **Step 4: Run focused and full tests**

Run: `cd bitiruvchilar-admin && node --test test/command-center-service.test.js && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add bitiruvchilar-admin/lib/command-center-service.js bitiruvchilar-admin/test/command-center-service.test.js
git commit -m "feat: add scoped command center aggregates"
```

### Task 5: Wire Read-Only Command Center APIs

**Files:**
- Modify: `bitiruvchilar-admin/canonical-server-v2.js`
- Modify: `bitiruvchilar-admin/package.json`
- Test: extend `bitiruvchilar-admin/test/command-center-service.test.js` or add `bitiruvchilar-admin/test/command-center-api.test.js` if route-level harness remains focused.

**Interfaces:**
- Consumes: `resolveScope(user)`, `buildCommandCenter(db,scope)`, `buildTerritoryDrilldown(db,scope,hudud)`.
- Produces HTTP endpoints:
  - `GET /api/command-center` — authenticated, scoped aggregate;
  - `GET /api/command-center/territory?hudud=<name>` — authenticated, scoped drill-down;
  - no write endpoints in this foundation phase.

- [ ] **Step 1: Write failing route authorization tests**

Assert:
- unauthenticated request gets 401;
- unknown/none role gets 403;
- leadership GET succeeds and remains read-only;
- territory user cannot broaden scope with query string;
- OP/OShP user cannot obtain another institution's counts;
- malformed territory query gets safe empty/403 behavior according to resolved scope, never all-region fallback;
- aggregate response contains no personal rows or sensitive keys.

- [ ] **Step 2: Run route test and verify failure**

Run the focused test file with `node --test`; expected FAIL because routes do not exist.

- [ ] **Step 3: Add imports and routes to `canonical-server-v2.js`**

Reuse existing `auth(req)` session check. Resolve scope after authentication and reject `role:'none'`. Do not change existing `/api/public/dashboard-summary`, graduate CRUD, medical, import, export, 3D, or health behavior.

- [ ] **Step 4: Add new modules to `npm run check`**

Add `node --check` entries for:
- `lib/access-scope.js`
- `lib/risk-engine.js`
- `lib/data-quality-service.js`
- `lib/command-center-service.js`

- [ ] **Step 5: Run complete verification**

Run: `cd bitiruvchilar-admin && npm run check`
Expected: syntax checks pass; all existing and new tests pass; no existing test count regresses.

- [ ] **Step 6: Commit**

```bash
git add bitiruvchilar-admin/canonical-server-v2.js bitiruvchilar-admin/package.json bitiruvchilar-admin/test
git commit -m "feat: expose scoped command center read APIs"
```

### Task 6: Foundation Regression and Branch Review Gate

**Files:**
- No product-code creation expected unless verification finds a defect.

**Interfaces:**
- Consumes all previous tasks.
- Produces a branch that is ready for the next plan (Command Center UI) but not yet merged to production.

- [ ] **Step 1: Run full project verification twice from a clean process**

Run: `cd bitiruvchilar-admin && npm run check`
Expected both runs: PASS, including all legacy tests and new foundation tests.

- [ ] **Step 2: Verify production-sensitive invariants manually from code/tests**

Confirm:
- existing `/health` unchanged;
- existing dashboard routes unchanged;
- no DB migration added by this phase;
- no existing write permission broadened;
- no public endpoint exposes new PII;
- 3D assets/routes are untouched.

- [ ] **Step 3: Compare branch to production base**

Run: `git diff --stat bitiruvchilar-admin-prod...command-center-2` and inspect changed files.
Expected: only spec/plan docs plus the foundation modules/tests/server/package changes from this plan.

- [ ] **Step 4: Commit any verification-only corrections separately**

Use a focused fix commit if required; otherwise create no extra commit.

## Follow-On Plans

After this foundation is green and reviewed, create separate plans for:

1. Command Center UI + smart 13-territory map drill-down.
2. TTB/SHTB and OP/OShP institution workspaces + role administration migration.
3. Reporting Center + Monitoring Center.
4. Security Operations + extended audit telemetry.
5. Production rollout, staging smoke test, PR, Railway health verification, and rollback readiness.
