# Leadership 3D Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the leadership 3D map softer and clearer, restore Buxoro/Kogon city visibility, increase neighborhood models, redesign TTB/SHTB objects, and animate data flow upward as OP/OShP -> TTB/SHTB -> Buxoro SSB.

**Architecture:** Move the current string-replacement logic out of `district-ux-wrapper.ts` into a pure, testable `leadership-3d-patch.ts`. Keep `district-ux-wrapper.ts` as the thin HTML-response wrapper. Build all visual changes by deterministic patch functions with idempotent markers so repeated wrappers/reloads never duplicate objects or scripts.

**Tech Stack:** Bun/TypeScript, existing Three.js r128 leadership HTML, Bun test runner, current wrapper chain.

**Spec:** `docs/superpowers/specs/2026-10-17-super-admin-rbac-3d-design.md`

**Depends on:** RBAC/UI plans only for deployment ordering; the 3D patch remains independent from admin data mutations.

## Global Constraints

- District colors become soft/pastel while status colors remain a separate green/yellow/red layer.
- Buxoro shahri and Kogon shahri must remain visibly selectable in province view.
- TTB/SHTB are visually larger than OP/OShP and carry a TTB/SHTB + district label.
- Neighborhood counts are deterministic: TTB/SHTB = 10 houses, OP = 5 houses, OShP = 4 houses when polygon space permits.
- Houses must stay inside their district/city polygon.
- Data direction is only OP/OShP -> own TTB/SHTB -> Buxoro SSB.
- The old center/SSB -> TTB/SHTB flow must be removed.
- District and TTB/SHTB focus must dim unrelated objects; Home resets focus.
- `/leadership` must remain responsive on desktop and mobile and must not break existing selection/camera controls.

## Review Focus

- Tiny city polygons must remain clickable even when their rendered area is smaller than nearby district meshes.
- Missing TTB/SHTB parent for an OP/OShP must skip that flow safely rather than draw to the wrong district.
- Dense polygons must stop house placement at available valid points instead of placing houses outside the boundary.
- Reapplying the patch must not duplicate scripts, styles, buildings, houses, particles, or event listeners.
- Lower-powered mobile devices must not receive an unbounded particle/mesh count.

---

### Task 1: Extract the current leadership patch into a pure module

**Files:**
- Create: `leadership-3d-patch.ts`
- Create: `tests/leadership-3d-patch.test.ts`
- Create: `tests/fixtures/leadership-markers.html`
- Modify: `district-ux-wrapper.ts`

**Interfaces:**
- Produces: `patchLeadership3d(input: string): string`.
- Produces constants `DISTRICT_PALETTE`, `HOUSE_COUNTS`, `PATCH_MARKER` for tests.
- `district-ux-wrapper.ts` only applies `patchLeadership3d()` to successful HTML responses for `/leadership`.

- [ ] **Step 1: Write failing extraction/regression tests**

Assert the pure patch preserves the current `Bugungi holat`, district focus, status ribbon, SSB headquarters, and current allowed institution types; applying it twice returns identical output on the second pass.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: FAIL because the pure module does not exist.

- [ ] **Step 3: Move existing patch logic without visual behavior changes**

Export the pure function and update the wrapper to import it. Do not alter `mobile-wrapper.ts`, `wrapper.ts`, or auth logic in this task.

- [ ] **Step 4: Run and verify GREEN**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add leadership-3d-patch.ts district-ux-wrapper.ts tests && git commit -m "refactor: isolate leadership 3D patch"`

### Task 2: Apply the soft district palette and restore city visibility

**Files:**
- Modify: `leadership-3d-patch.ts`
- Modify: `tests/leadership-3d-patch.test.ts`

**Interfaces:**
- Updates exported `DISTRICT_PALETTE`.
- Adds injected `ensureCityVisibility()` behavior for Buxoro shahri and Kogon shahri.

**Pinned palette:**
- Buxoro `0x88B7E8`
- Buxoro shahri `0x8EDBE8`
- Kogon `0xB9A8E8`
- Kogon shahri `0xE7CC91`
- Olot `0x91D3C4`
- Qorako'l `0x9AAAE5`
- Jondor `0x95D2B8`
- Peshku `0xA4CDE7`
- Vobkent `0xD8D39A`
- G'ijduvon `0xD3A6D8`
- Shofirkon `0xE4B18F`
- Romitan `0xBCA9DF`
- Qorovulbozor `0xE3A0A8`

- [ ] **Step 1: Write failing palette/city tests**

Assert all 13 palette values, separate status-color logic, explicit city visibility marker, and city labels configured to render above competing map surfaces.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: FAIL on new expectations.

- [ ] **Step 3: Implement palette and city material/label adjustments**

Keep district status green/yellow/red in ribbons/rings rather than replacing the pastel base material. Buxoro/Kogon city polygons receive explicit visibility/opacity/depth treatment and high-priority labels.

- [ ] **Step 4: Run and verify GREEN**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add leadership-3d-patch.ts tests/leadership-3d-patch.test.ts && git commit -m "feat: soften district palette and restore city visibility"`

### Task 3: Redesign TTB/SHTB and neighborhood models

**Files:**
- Modify: `leadership-3d-patch.ts`
- Modify: `tests/leadership-3d-patch.test.ts`

**Interfaces:**
- Injects `buildDistrictMedicalCenters()` for TTB/SHTB.
- Replaces current house builder with `buildNeighbourhoodHouses()` using `HOUSE_COUNTS = { TTB: 10, SHTB: 10, OP: 5, OShP: 4 }`.

- [ ] **Step 1: Write failing building/house tests**

Assert TTB/SHTB use a dedicated larger administrative-building builder, label includes type + district, house-count constants are exactly 10/10/5/4, and polygon-safe placement remains required.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement TTB/SHTB administrative models**

Use a wider multi-part building and larger selection ring than OP/OShP. Replace/hide the generic TTB/SHTB tower components so only the new primary model is visually dominant.

- [ ] **Step 4: Implement deterministic neighborhood placement**

Use the existing seeded hash + safe polygon-point logic; generate candidate rings around each institution and stop early if no safe points remain. Never force a point outside the polygon to meet the nominal count.

- [ ] **Step 5: Run and verify GREEN**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

`git add leadership-3d-patch.ts tests/leadership-3d-patch.test.ts && git commit -m "feat: redesign district medical centers and neighborhoods"`

### Task 4: Replace the flow animation with hierarchical upward data flow

**Files:**
- Modify: `leadership-3d-patch.ts`
- Modify: `tests/leadership-3d-patch.test.ts`

**Interfaces:**
- Injects `resolveDistrictCenter(inst)`, `buildHierarchicalFlows()`, `animateHierarchicalFlows(time)`.
- Flow edges are `{ from, to, level: 'facility-to-district'|'district-to-ssb' }`.

- [ ] **Step 1: Write failing flow tests**

Assert old SSB/center -> TTB/SHTB flow marker is removed; each OP/OShP resolves only to a TTB/SHTB with the same canonical district; every TTB/SHTB resolves to the SSB headquarters; particles advance from `from` toward `to`.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement edge construction**

Skip an OP/OShP edge if there is no matching district center. Deduplicate shared edges. Do not connect DPM facilities into the district chain.

- [ ] **Step 4: Implement bounded particle animation**

Use one lightweight line plus a small fixed number of moving points per edge; cap total animated points so mobile mesh/particle count is bounded.

- [ ] **Step 5: Run and verify GREEN**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

`git add leadership-3d-patch.ts tests/leadership-3d-patch.test.ts && git commit -m "feat: animate hierarchical medical data flow"`

### Task 5: Improve district/center focus and camera behavior

**Files:**
- Modify: `leadership-3d-patch.ts`
- Modify: `tests/leadership-3d-patch.test.ts`

**Interfaces:**
- Extends `applyDistrictFocus(name)`.
- Injects `applyCenterFocus(inst)` and `resetMapFocus()`.

- [ ] **Step 1: Write failing focus tests**

Assert district selection dims other districts; TTB/SHTB selection keeps its own OP/OShP + houses + flow edges prominent; Buxoro/Kogon city selection works; Home calls the single reset function and restores province camera/opacity.

- [ ] **Step 2: Run and verify RED**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement focus-layer tagging and camera presets**

Tag new houses/models/flows by district and parent center so focus does not rely only on the original district mesh material list.

- [ ] **Step 4: Run and verify GREEN**

Run: `bun test tests/leadership-3d-patch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add leadership-3d-patch.ts tests/leadership-3d-patch.test.ts && git commit -m "feat: improve 3D district and center focus"`

### Task 6: Production visual and regression verification

**Files:**
- No product-code changes unless verification identifies a defect.

- [ ] **Step 1: Run the full suite before deploy**

Run: `bun test`
Expected: PASS.

- [ ] **Step 2: Deploy to the existing Railway app service and wait for SUCCESS**

- [ ] **Step 3: Verify `/leadership` with a real authenticated session**

Expected: 200; Buxoro shahri and Kogon shahri visible/selectable; soft palette present; status rings remain distinct; TTB/SHTB models larger than OP/OShP; neighborhoods visibly increased.

- [ ] **Step 4: Verify flow direction visually and by HTML marker smoke test**

Expected: OP/OShP -> own TTB/SHTB -> Buxoro SSB; no old SSB -> district outward flow.

- [ ] **Step 5: Verify district/TTB/SHTB focus, Home reset, rotation, wheel/touch and mobile rendering**

- [ ] **Step 6: Verify auth/security regression**

Expected: `/login`, `/admin`, `/facility` unchanged; security headers/rate limiting/mobile login fix intact.
