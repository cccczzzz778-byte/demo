# Buxoro Bitiruvchilar Command Center 2.0 — Design Spec

Date: 2026-10-18
Target branch: `command-center-2`
Production base: `bitiruvchilar-admin-prod`

## 1. Purpose

Upgrade the existing Buxoro graduates platform into a management-oriented Command Center without breaking the working production system. Existing graduate data, medical-exam data, 3D/map experience, admin functions, import flows, backups, and production deployment remain intact unless a change is explicitly required by this design.

Primary success criteria:

- production behavior remains backward-compatible;
- existing regression tests continue to pass;
- new modules are isolated and testable;
- leadership gets one operational overview for region-level decisions;
- TTB/SHTB and OP/OShP users see only authorized scope;
- every write is attributable in an audit trail;
- risk flags are explainable rule-based signals, not opaque AI guesses;
- security telemetry stays private to authorized administrators.

## 2. Architecture Strategy

Use an evolutionary upgrade rather than a rewrite.

The current Node.js/Express application remains the runtime. Existing gateway, canonical server, data import, DB access, dashboard code, and Railway volume stay in place. New features are added as separate modules behind stable internal interfaces.

Proposed module boundaries:

- `lib/command-center-service.js` — aggregates leadership metrics only;
- `lib/risk-engine.js` — computes deterministic risk flags;
- `lib/data-quality-service.js` — duplicate/missing/conflicting-data checks;
- `lib/access-scope.js` — centralized role and organization scoping;
- `lib/monitoring-service.js` — operational state and freshness summaries;
- `lib/report-service.js` — export data models;
- `lib/security-events.js` — authorized security event summaries;
- `public/command-center.*` — new leadership UI;
- `public/institution-panel.*` — scoped TTB/SHTB/OP/OShP UI;
- `public/security-ops.*` — admin-only security view.

The gateway remains the single public entry point. New routes must not bypass the existing security headers, request limits, session validation, or CSRF/cross-site checks.

## 3. Command Center 2.0

Create a new premium leadership landing experience while preserving the existing dashboard as a compatible fallback during rollout.

The main view contains:

- total graduates;
- employed;
- unemployed;
- currently studying in residency/ordinatura;
- medical-exam coverage;
- data-quality warning count;
- active risk count;
- last successful data refresh time.

The center of the page is the Buxoro regional map. Selecting one of the 13 territories opens a drill-down panel with the same metrics scoped to that territory, recent changes, risk summary, and data-quality summary.

The existing 3D view remains available. No existing 3D asset is deleted as part of this project.

Visual direction: restrained government command-center aesthetic, dark navy/black background, high-contrast typography, minimal accent colors, green/yellow/red used only as status signals. Desktop leadership monitors are the primary layout; tablet and mobile remain fully usable.

## 4. Smart Regional Map

The map uses one canonical district/city naming layer already used by the current application.

Each territory receives a computed health state:

- green — no critical rule triggered and agreed KPI thresholds are healthy;
- yellow — one or more attention rules triggered;
- red — one or more critical rules triggered.

A territory color is never manually entered by users. It is derived from explainable rules and every state exposes the reason in the drill-down panel.

Map interactions must not mutate data.

## 5. Risk Engine

Risk Engine v1 is rule-based only.

Initial rule families:

- graduate remains unemployed beyond a configured age of record;
- person has not completed required medical examination;
- required profile fields are incomplete;
- likely duplicate record exists;
- conflicting employment/medical status exists;
- institution or territory data has not been refreshed within the configured freshness window;
- territory-level negative movement exceeds an agreed threshold.

Each risk result includes:

- `ruleId`;
- severity (`info`, `warning`, `critical`);
- entity type and entity ID;
- territory;
- human-readable reason;
- evidence fields used by the rule;
- computed timestamp.

Risk Engine does not directly edit source records. It only reports signals. Resolution happens through existing or scoped editing workflows.

Thresholds must live in one configuration object/file, not be scattered across UI code.

## 6. RBAC and Institution Scope

Roles:

- `leadership` — read-only access to all aggregate and drill-down views;
- `admin` — full authorized management, user administration, imports, audit, security operations;
- `ttb_shtb` — read access to own territory and subordinate OP/OShP data, limited authorized updates where enabled;
- `op_oshp` — access only to own institution records and permitted data-entry actions;
- existing admin behavior remains supported during migration.

Authorization rules are enforced server-side. Hiding controls in the browser is never treated as sufficient access control.

Every protected query must receive an authorization scope and apply it before returning rows or aggregates.

Leadership remains read-only by design.

## 7. Audit Trail

All write actions must create an audit event with:

- actor/user ID;
- role;
- institution/territory scope;
- action type;
- target entity;
- before/after summary where safe;
- timestamp;
- request correlation ID when available.

Sensitive raw credentials, session secrets, PINFL values, or medical details that are unnecessary for an audit event must not be copied into audit payloads.

Audit events are admin-readable and immutable through normal UI workflows.

## 8. Monitoring Center

Provide an operational summary for administrators and a simplified health badge for leadership.

Monitor:

- last successful data import;
- last successful backup;
- database readiness summary;
- service/deployment version exposed by the application;
- latest application start time;
- last data refresh by territory/institution;
- recent application errors by class;
- current application health.

Railway-specific privileged data is not exposed publicly. Where Railway telemetry is unavailable from application runtime, the UI must clearly say `unavailable` rather than invent a value.

## 9. Reporting Center

Provide filtered report generation for authorized users.

Supported report scopes:

- all region;
- one territory;
- one institution;
- employment status;
- education type;
- medical-exam status;
- risk category;
- data-quality category.

Initial formats:

- Excel-compatible export;
- printable/PDF-friendly report view;
- leadership summary view.

Reports must use the same scoped server-side query path as dashboards so a lower-scope user cannot export data they cannot view.

## 10. Security Operations

Admin-only page showing application-level security telemetry:

- failed login attempts;
- rate-limit triggers;
- rejected cross-site/CSRF-like requests where logged;
- 4xx/5xx summary available to the application;
- audit events;
- backup state;
- current deployed application version.

No password, session secret, environment secret, raw auth token, or full request body may be displayed.

Security Operations is an observability view, not an offensive scanning console.

## 11. Data Quality Center

Detect and surface:

- likely duplicate people;
- invalid or missing PINFL where applicable;
- missing territory/institution;
- missing required status fields;
- contradictory employment state;
- contradictory medical state;
- stale records;
- import ambiguities.

The center separates detection from mutation.

Bulk repair requires preview first. Preview shows counts and affected IDs without writing. Apply actions must be explicit and auditable. No automatic destructive cleanup runs on page load or application startup.

## 12. Data Flow

Read flow:

1. browser requests dashboard/module data;
2. gateway validates request/session;
3. route resolves role and scope;
4. service layer queries existing DB/data sources within scope;
5. aggregate/risk/data-quality logic computes derived fields;
6. response returns only necessary fields.

Write flow:

1. browser submits authorized change;
2. gateway/session/CSRF protections run;
3. server validates role + scope + payload;
4. service validates target record;
5. write occurs in a transaction where supported;
6. audit event is written;
7. response returns updated safe representation.

## 13. Error Handling

- validation errors: 400 with safe field-level message;
- unauthenticated: 401;
- authenticated but out of scope: 403;
- missing entity: 404;
- rate limited: 429;
- unexpected server error: 500 with generic client message and server-side correlation ID.

Internal stack traces, filesystem paths, secrets, SQL fragments, or environment values must not be returned to the browser.

A failure in risk/monitoring aggregation must not make the core graduate dashboard unavailable. Derived modules should degrade to `unavailable` or partial data where safe.

## 14. Security Requirements

Preserve existing gateway hardening and extend it without weakening compatibility.

Required controls:

- secure/HttpOnly/SameSite session cookie behavior remains enforced;
- HSTS stays production-only;
- content/security headers remain centralized at the gateway;
- server-side scope checks on every protected endpoint;
- input validation on write endpoints;
- request body and URL limits remain enforced;
- auth and expensive operations retain explicit timeouts;
- no secrets committed to Git;
- no personal data added to public aggregate endpoints;
- public dashboard responses remain minimized;
- dependency audit and regression tests remain part of release verification.

A future external OWASP ZAP/Burp/Nuclei/TLS assessment is treated as a separate verification activity, not falsely represented as completed by unit tests.

## 15. Testing Strategy

Existing tests are a release gate and must remain green.

Add focused tests for:

- role/scope authorization matrix;
- leadership read-only enforcement;
- TTB/SHTB territory isolation;
- OP/OShP institution isolation;
- risk rule determinism and severity;
- no PII leakage from aggregate endpoints;
- data-quality duplicate/ambiguity detection;
- preview-before-bulk-write behavior;
- audit record creation;
- report export scope enforcement;
- monitoring graceful degradation;
- new command-center route behavior;
- existing 3D/dashboard compatibility.

Production merge criteria:

- syntax/check task passes;
- all existing and new tests pass;
- production branch receives changes by PR only;
- Railway deployment reaches healthy/online state;
- core dashboard smoke checks succeed after deploy.

## 16. Rollout Strategy

Phase 1 — foundation:

- new service modules;
- access-scope layer;
- audit extensions;
- risk and data-quality read-only APIs;
- tests.

Phase 2 — Command Center UI:

- leadership dashboard;
- smart map drill-down;
- risk/data-quality panels;
- responsive behavior.

Phase 3 — institution workspaces:

- TTB/SHTB scoped panel;
- OP/OShP scoped data-entry panel;
- role administration migration.

Phase 4 — reporting/monitoring/security ops:

- report center;
- monitoring center;
- admin security operations.

Phase 5 — production rollout:

- complete regression suite;
- staged smoke test;
- PR review;
- deploy;
- verify health and core flows;
- retain rollback target from previous successful production deployment.

## 17. Non-Goals for This Version

- rewrite to a new framework;
- replace the current database solely for architectural fashion;
- opaque machine-learning scoring;
- automatic destructive data repair;
- public exposure of personal or security-sensitive records;
- deleting the existing 3D dashboard;
- making leadership users data-entry operators.

## 18. Acceptance Criteria

The upgrade is acceptable when:

- the current production functions still work;
- Command Center loads and shows scoped aggregate data;
- all 13 territories drill down correctly;
- risk reasons are explainable;
- unauthorized cross-territory/institution access is rejected server-side;
- leadership cannot modify records;
- writes create audit events;
- Data Quality Center detects issues without silently changing data;
- authorized report export respects scope;
- security/monitoring screens expose no secrets;
- existing and new tests pass;
- Railway production is healthy after rollout.
