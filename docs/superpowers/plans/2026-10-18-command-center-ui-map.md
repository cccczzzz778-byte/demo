# Command Center UI + Smart Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium, responsive leadership Command Center page that consumes the already-built scoped read APIs and provides a 13-territory interactive Buxoro map with drill-down, risk, and data-quality summaries while preserving the existing dashboard and 3D experience.

**Architecture:** Keep the current Node/CommonJS server and existing compressed dashboard untouched as the compatibility view. Add a new static Command Center page under `bitiruvchilar-admin/public/`, serve it through a dedicated authenticated route, and reuse/extract only the existing Buxoro map geometry needed for a focused smart-map component. Browser code consumes `/api/command-center` and `/api/command-center/territory`; no business authorization logic is moved to the client.

**Tech Stack:** Node.js >=22.13, CommonJS server, vanilla HTML/CSS/JavaScript, existing dashboard/map assets, `node:test` for static/route regression tests.

**Spec:** `docs/superpowers/specs/2026-10-18-command-center-2-design.md`

## Global Constraints

- Existing `/`, `/dashboard`, `/dashboard.html`, 3D view, imports, backups, and graduate CRUD remain backward-compatible.
- The new Command Center is read-only in this plan.
- Server-side scope is authoritative; client-side territory controls may narrow but never broaden access.
- No PINFL, phone, diagnosis text, credentials, raw graduate rows, or session secrets are rendered in the Command Center.
- Green/yellow/red are status signals only; UI must not infer unsupported facts.
- A failed derived section renders `unavailable`/empty-state content without breaking the rest of the page.
- Existing gateway security headers and request limits remain in force.
- No new frontend framework or runtime dependency is introduced.

## Review Focus

- A TTB/SHTB or OP/OShP user must never see clickable territories outside server-authorized scope.
- Map click behavior must use canonical territory names understood by the API, including city/district variants.
- Missing or partial API sections must render safely without `undefined`, broken layout, or fake zero claims.
- Existing map/3D assets must remain untouched and accessible after the new page is added.
- Mobile/tablet layout must preserve drill-down usability without horizontal overflow.

---

## File Structure

- Create `bitiruvchilar-admin/public/command-center.html` — semantic page shell and static placeholders only.
- Create `bitiruvchilar-admin/public/command-center.css` — responsive command-center styling and map/status visuals.
- Create `bitiruvchilar-admin/public/command-center.js` — API loading, safe rendering, territory interaction, drill-down state.
- Create `bitiruvchilar-admin/public/command-center-map.js` — isolated 13-territory geometry/interaction adapter derived from the existing Buxoro map, with no data access of its own.
- Modify `bitiruvchilar-admin/canonical-server-v2.js` — authenticated `/command-center` route and static asset delivery only.
- Modify `bitiruvchilar-admin/package.json` — syntax-check new JavaScript files.
- Create `bitiruvchilar-admin/test/command-center-ui.test.js` — static privacy, route-preservation, and UI-contract tests.

### Task 1: Command Center Page Shell

**Files:**
- Create: `bitiruvchilar-admin/public/command-center.html`
- Create: `bitiruvchilar-admin/public/command-center.css`
- Test: `bitiruvchilar-admin/test/command-center-ui.test.js`

**Interfaces:**
- Consumes: no runtime data yet.
- Produces stable DOM anchors: `#cc-root`, `#cc-status`, `#cc-metrics`, `#cc-map`, `#cc-territory-panel`, `#cc-risks`, `#cc-quality`, `#cc-refresh`, and links to the existing dashboard/3D view.

- [ ] **Step 1: Write failing static contract/privacy tests**

Assert that the HTML contains all required anchors, loads only local Command Center CSS/JS assets, has no inline secret/config placeholders, contains no sample PINFL/phone/diagnosis values, and includes a visible link back to the existing dashboard.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd bitiruvchilar-admin && node --test test/command-center-ui.test.js`
Expected: FAIL because `public/command-center.html` does not exist.

- [ ] **Step 3: Implement semantic shell and styling**

Build header, compact system-status area, KPI grid, central map region, right-side/stacked drill-down region, risks/data-quality panels, loading/error/empty states, and responsive breakpoints. Keep text factual and generic; values are injected only from API responses.

- [ ] **Step 4: Run focused tests**

Expected: PASS for shell/privacy assertions.

- [ ] **Step 5: Commit**

```bash
git add bitiruvchilar-admin/public/command-center.html bitiruvchilar-admin/public/command-center.css bitiruvchilar-admin/test/command-center-ui.test.js
git commit -m "feat: add command center leadership shell"
```

### Task 2: Smart 13-Territory Map Adapter

**Files:**
- Create: `bitiruvchilar-admin/public/command-center-map.js`
- Modify: `bitiruvchilar-admin/test/command-center-ui.test.js`
- Reference only: existing dashboard/map assets including `public/map-hover-fix.js` and the compressed dashboard source.

**Interfaces:**
- Produces `window.CommandCenterMap.mount(container, options)` where `options` has `territories`, `selectedHudud`, `onSelect(hudud)`, and `allowedHudud`/scope metadata.
- Territory data input: `{hudud, metrics, state?, reasons?}`.
- Map adapter performs presentation and event dispatch only; it never fetches data or modifies records.

- [ ] **Step 1: Write failing map contract tests**

Assert the map module defines exactly 13 canonical Buxoro territory identifiers, contains no network request code, does not import/contain personal fields (`pinfl`, `telefon`, `diagnosis`), and exposes a mount/select interface.

- [ ] **Step 2: Verify RED**

Run the focused UI test and confirm failure because the map adapter is absent.

- [ ] **Step 3: Reuse the existing map geometry safely**

Derive the 13-territory vector geometry/labels from the current Buxoro dashboard rather than inventing new geography. Normalize every map region to the canonical names already accepted by the backend. Preserve the old dashboard files unchanged.

- [ ] **Step 4: Add visual state behavior**

Apply neutral/green/yellow/red classes from explicit API-derived state only. Disallowed territories are non-interactive and visually muted. Selected territory gets a distinct focus state. Keyboard activation (`Enter`/`Space`) mirrors pointer selection.

- [ ] **Step 5: Run focused tests and commit**

```bash
git add bitiruvchilar-admin/public/command-center-map.js bitiruvchilar-admin/test/command-center-ui.test.js
git commit -m "feat: add scoped Buxoro smart map adapter"
```

### Task 3: Command Center Data Controller

**Files:**
- Create: `bitiruvchilar-admin/public/command-center.js`
- Modify: `bitiruvchilar-admin/test/command-center-ui.test.js`

**Interfaces:**
- Consumes `GET /api/command-center` and `GET /api/command-center/territory?hudud=<canonical>`.
- Consumes `window.CommandCenterMap.mount(...)` from Task 2.
- Produces safe DOM rendering for metrics, territories, risks, and data quality.

- [ ] **Step 1: Write failing renderer-contract tests**

Assert the controller uses same-origin relative API paths, uses `textContent`/safe node creation for server text rather than unsanitized server-driven `innerHTML`, never reads personal fields, handles 401/403 separately from 5xx/network errors, and supports `unavailable` derived sections.

- [ ] **Step 2: Verify RED**

Expected: FAIL because `command-center.js` is absent.

- [ ] **Step 3: Implement initial load and KPI rendering**

Render only fields defined by the foundation response: `metrics`, `risks`, `dataQuality`, `territories`, `scope`, `generatedAt`. Format counts with `Intl.NumberFormat('uz-UZ')`. Never fabricate percentages when denominator is zero.

- [ ] **Step 4: Implement drill-down flow**

On allowed map selection, call the territory endpoint, set loading state only for the drill-down panel, discard stale out-of-order responses using a request sequence token or `AbortController`, and preserve the overall page if drill-down fails.

- [ ] **Step 5: Implement risk/data-quality summaries**

Render severity counts, rule/category counts, and explainable reasons returned by the API. Do not render or infer hidden raw records. When a derived section is `{unavailable:true}`, display `Ma’lumot vaqtincha mavjud emas` rather than zero.

- [ ] **Step 6: Run tests and commit**

```bash
git add bitiruvchilar-admin/public/command-center.js bitiruvchilar-admin/test/command-center-ui.test.js
git commit -m "feat: connect command center UI to scoped APIs"
```

### Task 4: Authenticated Command Center Route and Static Assets

**Files:**
- Modify: `bitiruvchilar-admin/canonical-server-v2.js`
- Modify: `bitiruvchilar-admin/package.json`
- Modify: `bitiruvchilar-admin/test/command-center-ui.test.js`

**Interfaces:**
- Produces `GET /command-center` authenticated page.
- Produces local static assets `/command-center.css`, `/command-center.js`, `/command-center-map.js`.
- Existing public dashboard routes remain exactly as before.

- [ ] **Step 1: Write failing route-contract tests**

At minimum verify source-level route behavior: `/command-center` goes through the existing authentication path before serving the page; new asset routes serve only known fixed files; no wildcard filesystem path is accepted; old `/`, `/dashboard`, `/health`, `/panel`, and existing dashboard JS routes remain present.

- [ ] **Step 2: Verify RED**

Expected: route contract fails because the new page route is not wired.

- [ ] **Step 3: Add the smallest server integration**

Reuse `auth(req)` for `/command-center`. Return 401 or the existing login flow behavior if unauthenticated; do not make the page public. Serve the three fixed assets via exact route mapping and fixed paths under `public/`.

- [ ] **Step 4: Add syntax checks**

Add `node --check public/command-center.js` and `node --check public/command-center-map.js` to `npm run check`.

- [ ] **Step 5: Run full tests and commit**

```bash
cd bitiruvchilar-admin && npm run check
git add canonical-server-v2.js package.json public/command-center* test/command-center-ui.test.js
git commit -m "feat: serve authenticated command center UI"
```

### Task 5: Responsive, Accessibility, and Failure-State Hardening

**Files:**
- Modify: `bitiruvchilar-admin/public/command-center.html`
- Modify: `bitiruvchilar-admin/public/command-center.css`
- Modify: `bitiruvchilar-admin/public/command-center.js`
- Modify: `bitiruvchilar-admin/public/command-center-map.js`
- Modify: `bitiruvchilar-admin/test/command-center-ui.test.js`

**Interfaces:**
- No new backend interface.

- [ ] **Step 1: Add failing accessibility/failure tests**

Assert: meaningful page title; map container has accessible name; territory controls are keyboard focusable; loading/error status uses an ARIA live region; refresh control is a real button; CSS includes mobile breakpoint with no forced desktop minimum width; no color is the sole state indicator (text/label accompanies status).

- [ ] **Step 2: Verify RED, then implement minimal fixes**

Use responsive grid collapse at tablet/mobile widths, readable metric hierarchy, focus-visible styles, reduced-motion respect, and explicit status labels.

- [ ] **Step 3: Run focused and full tests**

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add bitiruvchilar-admin/public/command-center* bitiruvchilar-admin/test/command-center-ui.test.js
git commit -m "fix: harden command center responsive and accessible states"
```

### Task 6: UI Regression Gate

**Files:**
- No product-code creation expected unless verification finds a defect.

- [ ] **Step 1: Run full verification twice**

Run twice from clean CI/workflow processes: `cd bitiruvchilar-admin && npm run check`, then `npm audit --audit-level=high`.
Expected: all legacy + foundation + UI tests pass; audit reports no high-or-higher vulnerabilities.

- [ ] **Step 2: Inspect branch diff against the foundation head**

Confirm only the four Command Center public assets, focused UI test, minimal canonical-server route additions, package check additions, and this plan changed.

- [ ] **Step 3: Manual compatibility review**

Confirm in code/diff that existing dashboard/3D source and routes were not replaced, existing write endpoints were not changed, and new Command Center browser code has no write requests.

- [ ] **Step 4: Update draft PR verification notes**

Keep the PR draft/unmerged. Record exact test/audit results and any known UI limitations. Do not deploy production in this plan.

## Follow-On Plans

After this UI/map plan is green and reviewed:

1. TTB/SHTB + OP/OShP institution workspaces and scoped data-entry approvals.
2. Reporting Center + Monitoring Center.
3. Security Operations + extended audit telemetry.
4. Production rollout/staging smoke checks and rollback verification.
