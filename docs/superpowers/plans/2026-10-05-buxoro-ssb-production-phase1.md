# Buxoro SSB Production Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new, independent production-ready Buxoro viloyati Sog‘liqni saqlash dashboard shell with one Railway production URL, PostgreSQL persistence, secure admin login, a unified four-module dashboard UI, and no changes to existing KPI/Ona-bola/QR/Murojaatlar production systems.

**Architecture:** A React 19 + Vite + TypeScript frontend and Node.js + Express + TypeScript backend are built into one deployable Railway service. PostgreSQL runs as a separate Railway managed service, Prisma owns the portal metadata schema, and module data is exposed behind adapter interfaces that initially report `not_connected` rather than inventing statistics. Phase 1 ships the common shell and infrastructure only; real KPI/Ona-bola/QR/Murojaatlar integrations are separate plans.

**Tech Stack:** React 19, Vite, TypeScript, React Router, Recharts, Node.js, Express, Prisma, PostgreSQL, argon2, jose, helmet, express-rate-limit, Vitest, React Testing Library, Supertest.

**Spec:** `docs/superpowers/specs/2026-10-05-buxoro-ssb-unified-dashboard-design.md`

## Global Constraints

- The new production must be separate from the existing `demo`, KPI, QR, Murojaatlar and Ona-bola production systems.
- Existing production systems must not be modified during Phase 1.
- Frontend and backend must run from one Railway production service.
- PostgreSQL must be a separate Railway managed service and remain persistent across redeploys/restarts.
- The public dashboard must not display invented clinical or operational statistics; disconnected modules must explicitly show `Ma’lumot ulanmagan` / `not_connected`.
- Public aggregate dashboard pages must not expose patient-level or other personal medical data.
- Production secrets must be stored only in Railway environment variables.
- Admin passwords must be hashed with `argon2`.
- Security headers must use `helmet`; API rate limiting must be enabled.
- The layout must use a dark-blue left sidebar, top filters/header, white statistic cards, and responsive desktop/tablet/mobile behavior matching the approved design direction.

## Review Focus

- Missing or malformed `DATABASE_URL` must fail startup clearly instead of silently falling back to local files; Task 2 tests this.
- Database unavailable after startup must make readiness unhealthy without taking down static frontend delivery; Task 2 tests this.
- Invalid login attempts must never reveal whether the username or password was wrong and must be rate-limited; Task 4 tests this.
- Disconnected integrations must render explicit unavailable-state cards instead of fake `0` values; Task 5 tests this.
- Unknown `/api/*` paths must return JSON 404 while non-API browser routes must still serve the SPA; Task 3 tests this.

---

### Task 1: Bootstrap the new application repository and workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `apps/web/package.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/main.tsx`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`
- Test: `apps/web/src/bootstrap.test.tsx`
- Test: `apps/api/src/bootstrap.test.ts`

**Interfaces:**
- Consumes: approved design spec only.
- Produces: npm workspace commands `npm run dev`, `npm run build`, `npm test`; frontend entry `apps/web/src/main.tsx`; backend entry `apps/api/src/index.ts`.

- [ ] **Step 1: Write failing workspace/bootstrap tests**

Create tests asserting that the web app can mount a React root and that the API package exports a callable `createApp()` symbol from `apps/api/src/app.ts`.

- [ ] **Step 2: Run the tests to confirm failure**

Run: `npm test -- --run`

Expected: FAIL because the workspace and `createApp()` do not exist yet.

- [ ] **Step 3: Create the monorepo workspace and minimal entries**

Use npm workspaces with exact package names `@buxoro-ssb/web` and `@buxoro-ssb/api`. Add root scripts:
- `dev`: run web and api concurrently
- `build`: build web then api
- `test`: run both Vitest suites
- `start`: start compiled API server

Add `apps/api/src/app.ts` exporting `createApp(): Express` with an empty Express app for now.

- [ ] **Step 4: Run tests and build**

Run: `npm test -- --run && npm run build`

Expected: PASS and both packages build successfully.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: bootstrap buxoro ssb production workspace"
```

### Task 2: Add PostgreSQL/Prisma persistence and readiness checks

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/lib/env.ts`
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/health/health.service.ts`
- Create: `apps/api/src/health/health.routes.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/package.json`
- Test: `apps/api/src/lib/env.test.ts`
- Test: `apps/api/src/health/health.routes.test.ts`

**Interfaces:**
- Consumes: `createApp(): Express` from Task 1.
- Produces: `requireEnv(name: 'DATABASE_URL' | 'AUTH_SECRET'): string`; `checkDatabase(): Promise<'up' | 'down'>`; `GET /api/health` returning `{ status: 'ok' | 'degraded', database: 'up' | 'down' }`; `GET /api/ready` returning HTTP 200 only when database is `up`.

- [ ] **Step 1: Write failing environment and health tests**

Test cases:
- missing `DATABASE_URL` throws an error containing `DATABASE_URL is required`;
- health returns `status: 'ok'` when `checkDatabase()` reports `up`;
- health returns `status: 'degraded'` and readiness returns HTTP 503 when DB reports `down`.

- [ ] **Step 2: Run targeted tests and confirm failure**

Run: `npm --workspace @buxoro-ssb/api test -- --run src/lib/env.test.ts src/health/health.routes.test.ts`

Expected: FAIL because env validation and routes are absent.

- [ ] **Step 3: Define the Prisma schema**

Create models with these exact names: `Role`, `User`, `Region`, `Institution`, `IntegrationSource`, `CachedMetric`, `ReportJob`, `AuditLog`.

Required fields:
- every model: `id`, `createdAt`, `updatedAt` where applicable;
- `User`: `username` unique, `passwordHash`, `isActive`, `roleId`;
- `Region`: `name` unique;
- `Institution`: `name`, optional `regionId`, unique composite on `(name, regionId)`;
- `IntegrationSource`: `key` unique, `displayName`, `status`, optional `baseUrl`, optional `lastSuccessAt`, optional `lastError`;
- `CachedMetric`: `sourceKey`, `metricKey`, `periodKey`, `payload` JSON, unique composite `(sourceKey, metricKey, periodKey)`;
- `AuditLog`: optional `userId`, `action`, `entityType`, optional `entityId`, optional `payload` JSON.

- [ ] **Step 4: Implement env validation, Prisma client and health/readiness routes**

`checkDatabase()` must call `prisma.$queryRaw` with `SELECT 1` and return `down` on failure without throwing to the route.

- [ ] **Step 5: Generate Prisma client and run tests**

Run: `npm --workspace @buxoro-ssb/api run prisma:generate && npm --workspace @buxoro-ssb/api test -- --run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api
 git commit -m "feat: add postgres persistence and health checks"
```

### Task 3: Serve one production app and enforce API/browser routing behavior

**Files:**
- Create: `apps/api/src/http/static.ts`
- Create: `apps/api/src/http/not-found.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `package.json`
- Test: `apps/api/src/http/routing.test.ts`

**Interfaces:**
- Consumes: built frontend at `apps/web/dist`; health routes from Task 2.
- Produces: `registerStaticApp(app: Express, distDir: string): void`; unknown `/api/*` => JSON 404; unknown non-API GET => `index.html`.

- [ ] **Step 1: Write failing routing tests**

Assertions:
- `GET /api/does-not-exist` => HTTP 404 and `{ error: 'Not found' }`;
- `GET /kpi-statistikasi` in production mode => HTTP 200 with SPA HTML;
- `GET /api/health` is not intercepted by the SPA fallback.

- [ ] **Step 2: Run targeted test and confirm failure**

Run: `npm --workspace @buxoro-ssb/api test -- --run src/http/routing.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement API 404 and SPA static fallback**

`index.ts` must listen on `process.env.PORT ?? 3000` and `0.0.0.0`. Root production `start` must run the compiled API which serves `apps/web/dist`.

- [ ] **Step 4: Verify test and production build**

Run: `npm test -- --run && npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api package.json
 git commit -m "feat: serve unified production app"
```

### Task 4: Add secure admin authentication and protected admin route

**Files:**
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.routes.ts`
- Create: `apps/api/src/auth/auth.middleware.ts`
- Create: `apps/api/src/auth/auth.types.ts`
- Create: `apps/api/prisma/seed.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/package.json`
- Test: `apps/api/src/auth/auth.routes.test.ts`

**Interfaces:**
- Consumes: Prisma `User`/`Role` models and `AUTH_SECRET`.
- Produces: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`; `requireAdmin(req,res,next)` middleware; signed session cookie named `bssb_session` with `httpOnly`, `sameSite=lax`, `secure=true` in production.

- [ ] **Step 1: Write failing authentication tests**

Assertions:
- valid seeded admin credentials return HTTP 200 and set `bssb_session`;
- wrong username and wrong password both return exactly HTTP 401 with `{ error: 'Login yoki parol noto‘g‘ri' }`;
- five rapid invalid attempts from the same IP trigger HTTP 429 according to the login limiter;
- `GET /api/auth/me` without cookie returns HTTP 401;
- admin cookie returns `{ username, role: 'admin' }`.

- [ ] **Step 2: Run targeted tests and confirm failure**

Run: `npm --workspace @buxoro-ssb/api test -- --run src/auth/auth.routes.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement password hashing, session signing and login rate limit**

Use `argon2.verify` for passwords and `jose` HS256 for the signed session token. The seed script reads `ADMIN_USERNAME` and `ADMIN_PASSWORD` from environment variables and upserts the admin role/user; never hard-code production credentials.

- [ ] **Step 4: Add `helmet` and a general API rate limiter**

Apply `helmet()` globally. Apply a conservative default API limiter and a stricter login limiter without changing successful login semantics.

- [ ] **Step 5: Run authentication and complete API tests**

Run: `npm --workspace @buxoro-ssb/api test -- --run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api
 git commit -m "feat: add secure admin authentication"
```

### Task 5: Build the approved unified dashboard shell with honest integration states

**Files:**
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/router.tsx`
- Create: `apps/web/src/layout/AppShell.tsx`
- Create: `apps/web/src/layout/Sidebar.tsx`
- Create: `apps/web/src/layout/Topbar.tsx`
- Create: `apps/web/src/pages/DashboardPage.tsx`
- Create: `apps/web/src/pages/KpiPage.tsx`
- Create: `apps/web/src/pages/MotherChildPage.tsx`
- Create: `apps/web/src/pages/QrPage.tsx`
- Create: `apps/web/src/pages/AppealsPage.tsx`
- Create: `apps/web/src/pages/ReportsPage.tsx`
- Create: `apps/web/src/pages/SettingsPage.tsx`
- Create: `apps/web/src/components/ModuleStatCard.tsx`
- Create: `apps/web/src/components/ConnectionState.tsx`
- Create: `apps/web/src/styles/tokens.css`
- Create: `apps/web/src/styles/global.css`
- Modify: `apps/web/src/main.tsx`
- Test: `apps/web/src/pages/DashboardPage.test.tsx`
- Test: `apps/web/src/layout/AppShell.test.tsx`

**Interfaces:**
- Consumes: no real module data in Phase 1.
- Produces: routes `/`, `/kpi`, `/ona-bola`, `/qr`, `/murojaatlar`, `/hisobotlar`, `/sozlamalar`; reusable `ConnectionState` with exact states `'connected' | 'stale' | 'not_connected' | 'error'`.

- [ ] **Step 1: Write failing UI tests**

Assertions:
- sidebar contains `Bosh sahifa`, `KPI statistikasi`, `Ona bola statistikasi`, `QR kod statistikasi`, `Murojaatlar statistikasi`, `Hisobotlar`, `Sozlamalar`;
- the dashboard renders four module cards;
- each disconnected module card renders `Ma’lumot ulanmagan` and does **not** render a fake numeric total;
- mobile viewport does not produce a permanently fixed 240px sidebar that blocks content.

- [ ] **Step 2: Run web tests and confirm failure**

Run: `npm --workspace @buxoro-ssb/web test -- --run`

Expected: FAIL.

- [ ] **Step 3: Implement the shell and approved visual system**

Use CSS variables for the shared palette and spacing. Match the approved direction: dark-blue left navigation, white statistic cards, module accents (blue/pink/green/orange), top date/hudud filter placeholders, responsive collapse for small screens. Do not hard-code sample statistics.

- [ ] **Step 4: Add placeholder chart panels with availability messaging**

Charts must render an empty-state panel saying `Integratsiya ulangandan keyin dinamika ko‘rsatiladi` rather than made-up chart points.

- [ ] **Step 5: Run UI tests and production build**

Run: `npm --workspace @buxoro-ssb/web test -- --run && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web
 git commit -m "feat: add unified dashboard shell"
```

### Task 6: Add integration-source API contracts for later module plans

**Files:**
- Create: `apps/api/src/integrations/integration.types.ts`
- Create: `apps/api/src/integrations/integration.repository.ts`
- Create: `apps/api/src/integrations/integration.routes.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/src/integrations/integration.routes.test.ts`

**Interfaces:**
- Consumes: Prisma `IntegrationSource`.
- Produces: type `IntegrationKey = 'kpi' | 'ona_bola' | 'qr' | 'appeals'`; type `IntegrationStatus = 'connected' | 'stale' | 'not_connected' | 'error'`; `GET /api/integrations/status` returning four records in that fixed key set.

- [ ] **Step 1: Write failing status API tests**

Assertions:
- an empty DB is normalized to four entries with `not_connected`;
- no endpoint returns invented module totals;
- only admin can access future mutation endpoints; the Phase 1 status GET may be public because it exposes no secrets.

- [ ] **Step 2: Run targeted test and confirm failure**

Run: `npm --workspace @buxoro-ssb/api test -- --run src/integrations/integration.routes.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement repository and route**

Return only `key`, `displayName`, `status`, `lastSuccessAt`; never return `baseUrl`, secret headers, credentials or `lastError` details on the public route.

- [ ] **Step 4: Connect the web dashboard to the status API**

Update module cards so their `ConnectionState` is derived from `/api/integrations/status` while totals remain absent until later integrations provide verified metrics.

- [ ] **Step 5: Run all tests**

Run: `npm test -- --run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api apps/web
 git commit -m "feat: add integration status contracts"
```

### Task 7: Create the new Railway production and PostgreSQL services

**Files:**
- Create: `railway.json`
- Create: `Dockerfile`
- Modify: `.env.example`
- Modify: `README.md`
- Test: production smoke checks executed against the deployed URL.

**Interfaces:**
- Consumes: root `npm run build`, `npm start`, `/api/health`, `/api/ready`.
- Produces: Railway project/service named `buxoro-ssb-dashboard-production`, attached PostgreSQL service, generated production domain, and environment variables `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NODE_ENV=production`.

- [ ] **Step 1: Write container/deploy configuration**

The production image must install dependencies, run Prisma generate, build web+api, run `prisma migrate deploy` before application start, and then execute the compiled API server.

- [ ] **Step 2: Build and run container locally or in an isolated verification environment**

Run: `docker build -t buxoro-ssb-dashboard .`

Expected: image builds with no TypeScript/Vite errors.

- [ ] **Step 3: Create a new Railway project/service and attach PostgreSQL**

Use a new project/service; do not reuse or mutate the existing KPI/QR/Murojaat/Ona-bola services. Set the exact project/service name `buxoro-ssb-dashboard-production` unless Railway naming collision requires an automatically suffixed variant.

- [ ] **Step 4: Configure production variables and deploy**

Generate a strong random `AUTH_SECRET`; set admin username/password from user-approved credentials at execution time; connect `DATABASE_URL` from Railway PostgreSQL.

- [ ] **Step 5: Run Prisma migration and seed admin**

Run in production service context:

```bash
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npm --workspace @buxoro-ssb/api run prisma:seed
```

Expected: migration succeeds and admin user exists.

- [ ] **Step 6: Verify production health and routing**

Checks:
- `GET /api/health` => HTTP 200 with database `up`;
- `GET /api/ready` => HTTP 200;
- `/` loads the dashboard shell;
- `/kpi` loaded directly in a browser returns the SPA;
- `/api/nope` => JSON 404;
- all four module cards show disconnected state until their real integrations are configured.

- [ ] **Step 7: Verify persistence across redeploy**

Create or confirm the seeded admin, trigger one redeploy/restart, and verify the same user record remains in PostgreSQL and login still succeeds.

- [ ] **Step 8: Commit deployment files**

```bash
git add Dockerfile railway.json .env.example README.md
 git commit -m "ops: add railway production deployment"
```

### Task 8: Final Phase 1 verification and handoff

**Files:**
- Modify: `README.md`
- Create: `docs/production-checklist.md`

**Interfaces:**
- Consumes: deployed production URL and all previous task outputs.
- Produces: verified Phase 1 production baseline ready for separate KPI, Ona-bola, QR and Murojaatlar integration plans.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test -- --run && npm run build`

Expected: PASS with zero failing tests and successful production build.

- [ ] **Step 2: Run a manual responsive smoke test**

Verify desktop, tablet and phone widths for sidebar collapse, topbar overflow, module cards, and navigation.

- [ ] **Step 3: Run security smoke checks**

Confirm:
- no secrets are present in frontend bundles or repository files;
- login error response is generic;
- response headers include Helmet defaults;
- unauthenticated `/api/auth/me` returns 401.

- [ ] **Step 4: Document the production URL and current integration state**

`docs/production-checklist.md` must list the production domain, deployment verification date, DB readiness result, and each module as `not_connected` until a later plan connects verified real data.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/production-checklist.md
 git commit -m "docs: verify phase one production baseline"
```
