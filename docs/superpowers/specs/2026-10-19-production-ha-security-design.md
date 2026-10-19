# Buxoro SSB Dashboard — Production HA & Security Design

Date: 2026-10-19
Repository: `cccczzzz778-byte/demo`
Production platform: Railway

## 1. Goal

Build a production architecture for the Buxoro SSB dashboard that is highly available, resistant to common web attacks, observable, recoverable, and able to continue serving traffic when individual application instances fail.

The target is not a literal 100% security or 100% uptime guarantee; no real internet-facing system can honestly guarantee that. The goal is to minimize single points of failure, reduce blast radius, detect faults quickly, recover predictably, and protect sensitive administrative functions and data.

Primary success criteria:

- A single application replica can fail without taking the public site offline.
- Deployments should not require intentional downtime.
- Database loss must be protected by replication and tested backups before any production cutover.
- Public traffic must not directly reach Postgres or Redis.
- Login, admin, and control APIs must be protected by RBAC, session hardening, rate limits, CSRF protection, and audit logging.
- Production failures must be observable through health checks, tracing, error-rate monitoring, and security monitoring.
- A secondary provider must be able to host a standby application for disaster recovery.

## 2. Verified Current State

At design time, Railway production contains:

- `buxoro-3d-dashboard` from `cccczzzz778-byte/demo`, branch `main`, with 2 replicas in `ams`.
- `Postgres` with one replica and persistent volume `postgres-volume` mounted at `/var/lib/postgresql/data`.
- `ops-health-monitor` scheduled every 5 minutes.
- `security-header-monitor` scheduled hourly.
- `rbac-source-contract-probe` as a Bun Function.

The application currently starts with `bun monitoring-entry.ts` and uses the repository package scripts `start: bun monitoring-entry.ts` and `test: bun test`.

The existing application already contains pieces of RBAC/session hardening, including scoped admin APIs, session revocation, audit/event access, `HttpOnly`/`Secure`/`SameSite=Strict` cookie handling for revoked sessions, CSP nonce handling, and privileged role checks. The new design extends these controls rather than replacing them wholesale.

## 3. Target Architecture

```text
                         Internet
                            |
                  Cloudflare / WAF / DDoS
                            |
                     TLS + edge rules
                            |
                    Railway public domain
                            |
                Railway application service
                 /          |           \
            app #1       app #2       app #3
                 \          |           /
                    Private network
                     /             \
                  Redis        Postgres HA
                                 primary
                                    |
                                 replica
                                    |
                           encrypted backups
                                    |
                             offsite storage

        Monitoring / Security / Backup plane
        - ops-health-monitor
        - security-header-monitor
        - security-audit-worker
        - backup-worker
        - tracing / metrics / alerts

                 Disaster-recovery plane
                 secondary provider
                 standby application
```

## 4. Public vs Private Services

### Public

`buxoro-3d-dashboard`

- Only user-facing application service.
- 3 replicas in production when the Railway plan permits it reliably.
- Public domain terminates TLS at the edge.
- Health checks determine whether a replica is eligible to serve traffic.
- No direct public database or Redis endpoint is required.

### Private

`Postgres-HA`

- Primary plus replica/failover topology.
- Private application access only.
- No public TCP proxy unless a time-bounded, explicitly approved maintenance task requires one.
- Database credentials remain secret variables and are never committed to Git.

`Redis`

- Private only.
- Used for distributed rate limiting, login-failure counters, short-lived cache, and optional session metadata.
- Redis failure must not automatically corrupt or overwrite authoritative application data.

### Internal / Scheduled

`ops-health-monitor`

- Runs every 5 minutes.
- Checks application health and, where safe, downstream dependency readiness.
- Must produce a failure signal when the public app is unreachable or persistently unhealthy.

`security-header-monitor`

- Runs hourly.
- Verifies expected security headers such as CSP, HSTS, `X-Content-Type-Options`, frame restrictions, and referrer policy.

`security-audit-worker`

- Watches for abnormal authentication/authorization patterns and security events.
- Examples: repeated failed logins, 401/403/429 spikes, role changes, session revocations, unusual admin operations.

`backup-worker`

- Creates logical backups on the agreed schedule.
- Pushes encrypted copies to offsite storage.
- Records backup success/failure and restore-test status.

### Standby

`dashboard-standby`

- Runs on a second provider.
- Receives tested releases or deployable artifacts from the same source of truth.
- Does not become active merely because a single Railway app replica fails; it is for provider-level disaster recovery.

## 5. Availability Design

### Application replicas

Production target: 3 replicas.

- Railway load balancing distributes public traffic across healthy replicas.
- Restart policy should be `ALWAYS` for the stateless app process.
- Deployment overlap should keep the old healthy deployment serving while the new deployment becomes healthy.
- Draining time should allow in-flight requests to finish before an old replica is terminated.
- Application code must avoid storing authoritative user/session state only in process memory.

### Health model

Use separate concepts for:

- Liveness: process is alive and can serve HTTP.
- Readiness: application can serve real traffic safely.
- Dependency health: DB/Redis availability and latency.

A dependency outage should not cause every app replica to enter a restart loop unless continuing to serve would be unsafe.

### Failure isolation

- One app replica failure: remaining replicas continue serving traffic.
- Redis failure: rate limiting/cache may degrade according to policy, but primary database data remains authoritative.
- Postgres primary failure: database failover procedure promotes a synchronized replica where supported and tested.
- Bad deployment: rollback/redeploy last known-good build.
- Railway provider outage: DNS/failover procedure activates the standby provider.

## 6. Security Controls

### Authentication and session security

- Session cookies: `HttpOnly`, `Secure`, `SameSite=Strict` wherever compatible with required flows.
- Session IDs must be high-entropy and server-verifiable.
- Session revocation remains server-side and immediate for high-risk events.
- Role or scope reduction must invalidate active privileged sessions.
- Inactivity timeout and absolute session lifetime must be enforced.
- Privileged sessions should be shorter-lived than ordinary sessions.

### Login brute-force protection

Initial policy:

- 5 failed attempts per account within 10 minutes triggers temporary lockout or challenge.
- IP and account counters are separate to reduce distributed and targeted abuse.
- Counters live in Redis so all app replicas share the same state.
- Successful authentication resets the relevant failure counter when appropriate.
- Security logs must not record plaintext passwords, session tokens, or reusable secrets.

### API rate limits

Initial limits, subject to measured production traffic:

- Admin/control API: 60 requests/minute per authenticated user, with stricter limits on destructive endpoints.
- Public API: 120 requests/minute per IP.
- Login endpoint: stricter than ordinary public endpoints and tied to brute-force counters.

Rate limits should return `429` with appropriate retry information where practical.

### CSRF

All state-changing browser requests must be protected using one or more of:

- CSRF tokens bound to the session,
- strict origin/referer validation where safe,
- SameSite cookie protections.

GET/HEAD requests must not perform state-changing actions.

### RBAC and authorization

- Existing scoped RBAC remains authoritative.
- Authorization checks happen server-side for every privileged operation.
- UI hiding is never treated as an authorization control.
- Super Admin, province-level control, district-level control, and institution-level scopes must remain explicit and auditable.

### Input and upload security

- Explicit maximum request body sizes.
- Upload file size limits.
- MIME/type allowlist for accepted formats.
- Reject executable/server-side script formats unless a defined feature explicitly needs them.
- Normalize filenames and prevent path traversal.
- Uploaded user content must never be executed by the application runtime.

### Browser security headers

Expected baseline:

- Strict Content-Security-Policy with nonce-based scripts where needed.
- Strict-Transport-Security after HTTPS-only behavior is verified.
- `X-Content-Type-Options: nosniff`.
- Frame protection through CSP `frame-ancestors` and/or compatible legacy header.
- Referrer policy appropriate for authenticated/admin pages.
- No sensitive responses cached by shared/public caches.

### Secret management

- No passwords, tokens, DB credentials, API keys, or signing secrets in Git.
- Secrets stored in Railway/provider secret stores.
- Rotate secrets after suspected exposure.
- Do not expose secret values in logs, error pages, or client-side JavaScript.

## 7. Edge / WAF Layer

Cloudflare or an equivalent edge provider sits in front of Railway.

Functions:

- TLS termination / HTTPS enforcement.
- DDoS mitigation.
- WAF managed rules.
- Bot mitigation where useful.
- Coarse IP/ASN/country rules only when justified by observed abuse.
- Edge rate limiting for `/login`, `/admin`, and sensitive `/api/control/*` paths.
- Optional challenge rules for suspicious clients.

Origin-hardening goal:

- Prefer traffic to reach the application through the approved edge path.
- If Railway origin addressing cannot be fully hidden, application-level authorization and rate limiting remain mandatory.

## 8. Database and Backup Design

### Database HA

The existing single Postgres instance is currently the main single point of failure.

Migration must not replace it in one destructive step.

Safe sequence:

1. Verify a current backup can be produced.
2. Restore that backup into an isolated test database.
3. Validate application schema and authentication/RBAC data in the restored copy.
4. Provision the HA database topology.
5. Establish replication or controlled data synchronization.
6. Compare critical row counts/checksums and application smoke tests.
7. Schedule a controlled cutover.
8. Keep the old DB available as a rollback source until the new system is proven stable.

### Backup schedule

Target policy:

- Continuous/PITR capability when the selected database platform supports it.
- Logical backup every hour.
- Daily snapshot.
- Retention: 7 daily, 4 weekly, 6 monthly copies as a starting point.
- Offsite encrypted copy outside the primary Railway project/provider.

### Restore testing

A backup is not considered reliable until restored successfully.

- Automated or scheduled restore verification at least monthly.
- Validate schema, core row counts, authentication tables, and representative read queries.
- Record the last successful restore-test timestamp.

## 9. Observability and Alert Thresholds

Initial thresholds:

- 5xx error rate > 1% for 5 minutes: alert.
- p95 application latency > 1.5 seconds for 5 minutes: alert.
- `/health` fails twice consecutively: critical incident signal.
- Database connection utilization > 80%: alert.
- CPU or memory > 80% for 10 minutes: capacity/scaling signal.
- Sudden 401/403/429 increase: security review signal.

Required telemetry:

- HTTP request counts by status class.
- p50/p90/p95/p99 response time.
- Application CPU/memory/network usage.
- DB pool saturation and query failures.
- Redis connectivity/errors.
- Authentication failures and authorization denials.
- Admin security/audit events.

Tracing should be enabled where it provides actionable data and does not expose secrets or sensitive payloads.

## 10. Deployment Safety

### Zero/low-downtime deployment

- New deployment must become healthy before old replicas are removed.
- Health check endpoint must not return success before the process is actually ready.
- Overlap/draining settings must be preserved and validated.

### CI gates

Before production deployment:

- `bun test` must pass.
- Security/RBAC regression tests must pass.
- Static checks/linting should run when available.
- Dependency/security scanning should run in CI.
- Deployment should not proceed from a commit with known failing critical tests.

`rbac-source-contract-probe` should not remain a permanent production runtime dependency if its checks can run reliably in CI; its useful contract checks should be migrated into the CI/security validation path before removal.

## 11. Disaster Recovery

### Standby application

- Secondary provider maintains a tested, deployable copy of the application.
- Configuration is reproducible from source and documented secret names.
- Standby does not rely on local ephemeral filesystem state.

### Failover trigger

Provider failover is reserved for a sustained provider-level outage, not ordinary replica failure.

Target recovery objective:

- Application RTO target: 0–30 seconds for individual app replica failure.
- Provider-level failover may take longer depending on DNS/edge routing and database recovery mechanics; this must be measured in drills rather than assumed.
- Data-loss target: near-zero where synchronous replication/PITR architecture permits it, but never claimed without measured evidence.

### Failback

Returning traffic to Railway after an outage requires:

- data consistency check,
- health verification,
- smoke test,
- controlled DNS/edge switch,
- post-incident review.

## 12. Migration Order

1. Audit current production service/domain/network/security state.
2. Move app target from 2 to 3 replicas if plan/capacity supports it.
3. Provision private Redis.
4. Add distributed rate limiting and brute-force protections.
5. Add CSRF, request-size limits, upload validation, and session hardening where gaps exist.
6. Add/verify audit events and security telemetry.
7. Build and test database backup/restore workflow.
8. Provision HA database topology and validate replica/synchronization.
9. Controlled database cutover with rollback plan.
10. Configure Cloudflare/WAF and edge rate rules.
11. Harden origin exposure.
12. Provision secondary-provider standby application.
13. Run chaos/failure drills.
14. Remove obsolete runtime probe/test services only after their checks are covered elsewhere.

## 13. Rollback Rules

- Never delete the current database or volume during initial HA migration.
- Never perform automated destructive database restore/rollback.
- Application rollback uses the last known-good build.
- Database cutover must have a documented reversal path.
- Configuration changes should be staged/reviewed before destructive production actions when the platform supports staging.

## 14. Acceptance Criteria

The architecture is considered production-hardened only when all of the following are demonstrated:

- 3 app replicas are healthy and one can be terminated without user-visible outage beyond the target window.
- Health checks and tracing are verified with live traffic.
- Redis-based distributed rate limiting works across replicas.
- Brute-force protections block repeated login abuse without exposing secrets.
- CSRF protection exists for state-changing browser operations.
- Security headers pass the automated monitor.
- Postgres backup restore succeeds in an isolated environment.
- HA database failover is tested before declaring the DB highly available.
- No public TCP endpoint exists for DB/Redis unless explicitly approved for a temporary maintenance window.
- Monitoring detects simulated 5xx/latency/authentication anomalies.
- Bad deployment rollback is tested.
- Secondary provider standby can boot from the same source/config model.
- A disaster-recovery drill is completed and actual RTO/RPO are recorded.

## 15. Non-goals / Explicit Limits

- This design does not claim mathematically guaranteed 100% uptime or security.
- It does not automatically delete or replace the existing production database.
- It does not expose secrets through documentation or Git.
- It does not assume a backup is valid without a successful restore test.
- It does not treat extra service count alone as high availability; each service must have a clear role, failure mode, and recovery path.
