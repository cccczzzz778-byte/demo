# DMED Professional Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the existing DMED production app into a professional, keyboard-friendly, secure, testable Express/PostgreSQL application while preserving all existing institutions, users, staff rows, Excel flows, and admin drilldown behavior.

**Architecture:** Keep Node.js + Express + PostgreSQL + vanilla HTML/CSS/JS. Remove runtime source patching, move UI behavior into static frontend files, centralize validation/security helpers, and keep all authorization/server data rules on the backend. Preserve the existing database and deploy from `dmed-production` to the current Railway production service.

**Tech Stack:** Node.js 20+, Express 4, PostgreSQL (`pg`), `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `xlsx`, `helmet`, `express-rate-limit`, vanilla HTML/CSS/JavaScript, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-05-dmed-professional-hardening-design.md`

## Global Constraints

- Do not drop or recreate PostgreSQL tables; existing institutions, users, credentials, and staff rows must survive deployment.
- Keep the current business ownership rules: institution users only see/manage their own institution data; admin sees all.
- Keep Excel template/import/export behavior and requested medical staff column order.
- Employment rate remains numeric and accepts comma/dot input such as `1`, `0,5`, `0.5`, `0,25`.
- PINFL remains exactly 14 digits.
- Production must require `JWT_SECRET`; no insecure production fallback.
- Production cookies remain `httpOnly` and `secure`.
- Keep the current `dmed-production` branch and current Railway app/Postgres services.
- Do not add React/Vue or another frontend framework.
- Runtime must no longer depend on `patch-ui.js` or `patch-server.js`.

## Review Focus

- Repeated Enter/click during login or save must result in only one request and one mutation.
- A malformed phone/PINFL/employment value must fail with a field-specific code, not a generic server error.
- An admin scoped to one institution must never export or render another institution's staff until scope is cleared.
- A modal opened and closed only with the keyboard must retain sane focus behavior and not trap the user after closing.
- Production startup with missing `JWT_SECRET` must fail safely before serving traffic, while non-production tests may use an explicit test secret.

---

### Task 1: Centralize validation and security configuration

**Files:**
- Create: `lib/validation.js`
- Create: `lib/security.js`
- Modify: `lib/staff-import.js`
- Create: `tests/validation.test.js`
- Create: `tests/security.test.js`

**Interfaces:**
- Produces: `normalizeEmploymentRate(value) -> string|null`
- Produces: `validateStaffInput(input, options) -> { ok, value?, error?, field? }`
- Produces: `validateInstitutionInput(input) -> { ok, value?, error?, field? }`
- Produces: `validateAccountInput(input) -> { ok, value?, error?, field? }`
- Produces: `resolveJwtSecret(env) -> string` and throws in production when missing.
- Produces: `LOGIN_RATE_LIMIT = { windowMs, limit }` for middleware configuration.

- [ ] **Step 1: Write failing validation tests**

Add tests asserting: valid `0,5` normalizes to `0.5`; invalid employment text returns `invalid_employment`; PINFL shorter/longer than 14 digits returns `invalid_pinfl`; required full name/position/institution name/district return stable field codes; phone length/shape is bounded; password shorter than 8 returns `weak_credentials`.

- [ ] **Step 2: Run validation tests to verify failure**

Run: `node --test tests/validation.test.js`
Expected: FAIL because `lib/validation.js` does not exist or exported functions are missing.

- [ ] **Step 3: Implement validation helpers**

Implement the interfaces above in `lib/validation.js`, reusing the numeric employment normalization contract already used by staff import. Keep normalized strings trimmed and bounded according to the spec.

- [ ] **Step 4: Run validation tests to verify pass**

Run: `node --test tests/validation.test.js`
Expected: PASS.

- [ ] **Step 5: Write failing security tests**

Assert `resolveJwtSecret({NODE_ENV:'production'})` throws, `resolveJwtSecret({NODE_ENV:'production',JWT_SECRET:'x'})` returns the supplied secret, and login rate-limit configuration has a finite positive window and limit.

- [ ] **Step 6: Implement security helpers**

Implement `lib/security.js` with the exact interfaces above. Do not read process globals inside pure helper functions except where an exported factory explicitly accepts `env`.

- [ ] **Step 7: Run focused tests**

Run: `node --test tests/validation.test.js tests/security.test.js`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/validation.js lib/security.js lib/staff-import.js tests/validation.test.js tests/security.test.js
git commit -m "feat: centralize validation and security rules"
```

### Task 2: Harden the Express server and remove runtime patching

**Files:**
- Modify: `server.js`
- Modify: `package.json`
- Delete after migration: `patch-ui.js`
- Delete after migration: `patch-server.js`
- Test: `tests/server-contract.test.js`
- Existing tests: `tests/staff-import.test.js`, `tests/staff-scope.test.js`

**Interfaces:**
- Consumes: validation/security helpers from Task 1.
- Produces: stable JSON errors `{ error, field? }` for known validation failures.
- Produces: `/api/login` protected by rate limiting.
- Produces: static frontend served directly without mutating source files at startup.

- [ ] **Step 1: Write failing server contract tests**

Assert `package.json` start script does not include `patch-ui.js` or `patch-server.js`; `server.js` imports/uses Helmet and login rate-limit middleware; production secret resolution comes from `lib/security.js`; known staff/account/institution routes use centralized validators.

- [ ] **Step 2: Run contract tests to verify failure**

Run: `node --test tests/server-contract.test.js`
Expected: FAIL on current patch-based startup/security contracts.

- [ ] **Step 3: Add dependencies and simplify scripts**

Add `helmet` and `express-rate-limit`. Set `start` to run the intentional test-account bootstrap only if retained, then `node server.js`; set `test` to syntax-check runtime/frontend JS and run all Node tests.

- [ ] **Step 4: Refactor `server.js`**

Use `helmet()`, JSON/body limits, login rate limiter, `resolveJwtSecret(process.env)`, centralized validation, stable field error codes, and existing server-side role checks. Keep current safe schema initialization only; no destructive migration.

- [ ] **Step 5: Preserve Excel and staff-scope endpoints**

Ensure `/api/import/template.xlsx`, `/api/import/preview`, `/api/import/staff`, `/api/export/staff.xlsx`, `/api/staff`, institution CRUD/account routes, dashboard, login/logout/me, and submit behavior remain available with current authorization.

- [ ] **Step 6: Remove patch scripts from runtime**

Delete `patch-ui.js` and `patch-server.js` only after equivalent behavior has been moved into final source files.

- [ ] **Step 7: Run backend tests and syntax checks**

Run: `npm test`
Expected: all existing and new tests PASS; no syntax errors.

- [ ] **Step 8: Commit**

```bash
git add server.js package.json package-lock.json tests/server-contract.test.js
git rm patch-ui.js patch-server.js
git commit -m "refactor: harden server and remove runtime patching"
```

### Task 3: Rebuild login and shared UI as professional static assets

**Files:**
- Modify: `public/index.html`
- Create: `public/app.css`
- Create: `public/app.js`
- Create: `public/ui.js`
- Create: `public/auth.js`
- Create: `tests/auth-ui-contract.test.js`

**Interfaces:**
- Produces: real `<form id="loginForm">`.
- Produces: `setBusy(button, busy, labels)` shared async helper.
- Produces: `openModal(html, { initialFocus, opener })` and `closeModal()` with Esc/focus restoration.
- Produces: `togglePassword(inputId, button)` accessible show/hide behavior.
- Produces: login submit handler that ignores duplicate submissions while busy.

- [ ] **Step 1: Write failing auth/UI contract tests**

Assert final HTML contains a login form, submit button, password visibility button with `aria-label`, Caps Lock message target, external CSS/JS includes, and no giant inline application script. Assert frontend JS contains Escape handling, `focus-visible` styles exist, and login submission is guarded by a busy flag.

- [ ] **Step 2: Run UI contract tests to verify failure**

Run: `node --test tests/auth-ui-contract.test.js`
Expected: FAIL against current inline UI.

- [ ] **Step 3: Build static shell and styles**

Move the existing green DMED visual language into `public/app.css`; add consistent controls, visible `:focus-visible`, disabled/loading states, responsive layout, sticky table headers, modal sizing, empty-state styles, and non-overlapping long text behavior.

- [ ] **Step 4: Implement shared UI helpers**

Create `public/ui.js` with modal open/close, focus restoration, busy-state helper, toast/message helper, and Esc handling.

- [ ] **Step 5: Implement login UX**

Create `public/auth.js`: Enter submits through the real form, password eye toggles text/password with accessible label, Caps Lock warning uses `getModifierState('CapsLock')`, invalid credentials are distinguished from network/server errors, and duplicate submissions are prevented.

- [ ] **Step 6: Wire application bootstrap**

Create `public/app.js` to load `/api/me`, show login/app states, manage tabs/language, and preserve current admin vs institution navigation visibility.

- [ ] **Step 7: Run UI contract tests and syntax checks**

Run: `node --check public/app.js && node --check public/ui.js && node --check public/auth.js && node --test tests/auth-ui-contract.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add public/index.html public/app.css public/app.js public/ui.js public/auth.js tests/auth-ui-contract.test.js
git commit -m "feat: rebuild professional login and shared UI"
```

### Task 4: Professionalize staff, institution, and account forms

**Files:**
- Create: `public/staff.js`
- Create: `public/institutions.js`
- Modify: `public/app.js`
- Modify: `public/index.html`
- Create: `tests/forms-ui-contract.test.js`

**Interfaces:**
- Consumes: `openModal`, `closeModal`, `setBusy`, API request helper.
- Produces: staff form with field-specific client errors and Enter submit.
- Produces: institution form with field-specific client errors and Enter submit.
- Produces: institution account form with password visibility toggle and Enter submit.

- [ ] **Step 1: Write failing form contract tests**

Assert staff form supports numeric employment input, PINFL maxlength/pattern semantics, required full name/position; account modal includes password toggle; icon-only edit/delete/key controls have `title` and `aria-label`; modal forms submit through form events rather than arbitrary Enter key handlers.

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test tests/forms-ui-contract.test.js`
Expected: FAIL before new modules exist.

- [ ] **Step 3: Implement staff module**

Move staff render/search/add/edit/delete logic into `public/staff.js`. Map stable backend codes to field messages. Prevent double-save/delete requests. Preserve admin institution selection and institution ownership restrictions.

- [ ] **Step 4: Implement institution/account module**

Move institution CRUD, credential creation/update, password visibility, confirmations, and busy/error states into `public/institutions.js`.

- [ ] **Step 5: Add keyboard/focus behavior to all modal forms**

Opening focuses first meaningful input; Esc closes when not actively committing; Enter submits the form once; closing restores focus to opener.

- [ ] **Step 6: Run focused tests and syntax checks**

Run: `node --check public/staff.js && node --check public/institutions.js && node --test tests/forms-ui-contract.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add public/staff.js public/institutions.js public/app.js public/index.html tests/forms-ui-contract.test.js
git commit -m "feat: professionalize staff and institution forms"
```

### Task 5: Preserve and polish Excel flows, admin drilldown, and table states

**Files:**
- Create: `public/import.js`
- Create: `public/reports.js`
- Modify: `public/staff.js`
- Modify: `public/institutions.js`
- Modify: `public/index.html`
- Modify: `public/app.css`
- Modify: `tests/staff-scope.test.js`
- Create: `tests/data-ui-contract.test.js`

**Interfaces:**
- Produces: `selectInstitutionScope(id)` and `clearInstitutionScope()`.
- Produces: scoped staff rendering and `downloadStaffExcel()` using current scope.
- Produces: Excel import preview/import UX with counts and row-specific errors.

- [ ] **Step 1: Extend scope tests**

Assert admin institution scope selects only matching staff, clearing scope returns all staff, invalid scope falls back safely, and institution users cannot override their own scope.

- [ ] **Step 2: Write failing data UI contract tests**

Assert clickable institution names, visible selected-institution badge/header, “Barcha xodimlar” control, scoped Excel URL behavior, empty-state containers, import preview counts, and loading state hooks exist.

- [ ] **Step 3: Run tests to verify failure where appropriate**

Run: `node --test tests/staff-scope.test.js tests/data-ui-contract.test.js`
Expected: existing scope helper tests may pass; new UI contract tests FAIL until implementation.

- [ ] **Step 4: Implement admin drilldown polish**

Make institution names keyboard-clickable controls/links, show selected institution header and staff count, preserve search inside scope, render friendly empty state, and clear scope with “Barcha xodimlar”.

- [ ] **Step 5: Implement import/report modules**

Move Excel import/template/preview/import logic to `public/import.js` and report/export logic to `public/reports.js`; preserve file size/row limits, numeric employment formats, duplicate PINFL errors, institution-only import, admin scoped export, and institution own export.

- [ ] **Step 6: Run focused tests and syntax checks**

Run: `node --check public/import.js && node --check public/reports.js && node --test tests/staff-scope.test.js tests/data-ui-contract.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add public/import.js public/reports.js public/staff.js public/institutions.js public/index.html public/app.css tests/staff-scope.test.js tests/data-ui-contract.test.js
git commit -m "feat: polish drilldown and Excel workflows"
```

### Task 6: Full regression verification and Railway production deployment

**Files:**
- Modify only if verification exposes defects: relevant source/test files.
- Verify: `package.json`, `server.js`, `public/*`, `lib/*`, `tests/*`.

**Interfaces:**
- Consumes all previous tasks.
- Produces a settled Railway production deployment with healthy runtime.

- [ ] **Step 1: Run complete local/static verification**

Run: `npm test`
Expected: all tests PASS and all configured syntax checks PASS.

- [ ] **Step 2: Review the final startup path**

Verify `package.json` no longer invokes patch scripts; verify `server.js` does not rewrite frontend/source files; verify no destructive SQL (`DROP TABLE`, `TRUNCATE`, blanket `DELETE`) was introduced.

- [ ] **Step 3: Verify security configuration before deploy**

Confirm Railway production already has `JWT_SECRET`, `DATABASE_URL`, admin variables, and the existing test account setup if intentionally retained. Do not reveal secret values in user-facing output.

- [ ] **Step 4: Deploy from `dmed-production`**

Allow/prompt Railway to build the latest branch commit. Follow the latest deployment until it reaches `SUCCESS`.

- [ ] **Step 5: Inspect deployment/runtime logs**

Expected: tests pass during pre-deploy/start checks, server starts on Railway port, no patch script messages, no fatal DB migration error, no missing-secret error.

- [ ] **Step 6: Verify production health and request behavior**

Verify `/api/health` is healthy and recent HTTP/runtime logs show expected successful login/app requests. Check for new 5xx responses.

- [ ] **Step 7: Manual functional checklist on production**

Verify: admin login; test institution login; password eye; Enter login; Caps Lock warning where browser supports it; Esc modal; Tab/focus; staff add/edit; institution add/edit/account; admin institution drilldown; scoped Excel export; institution Excel template/preview/import/export; mobile-width layout sanity.

- [ ] **Step 8: Final full test evidence**

Re-run or confirm fresh `npm test` output from the final production commit and record deployment ID/status used for completion claim.

- [ ] **Step 9: Commit any verification fixes**

If verification found a defect, repeat the failing test → fix → passing test cycle and deploy again. Otherwise no extra commit is needed.
