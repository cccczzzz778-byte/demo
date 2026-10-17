# Bitiruvchilar Dashboard + Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 9 823 ta bitiruvchini bitta ishonchli kartochka modeli asosida boshqarish, 3 184 OTM va 283 tibbiyot yo‘nalishi bitiruvchisini to‘g‘ri hisoblash, admin paneldan barcha kerakli ma’lumotni tahrirlash va 3D dashboardda faqat real agregat ko‘rsatkichlarni chiqarish.

**Architecture:** Mavjud Node.js + SQLite tizimi saqlanadi. `excel_graduates` jadvali migratsiya orqali yagona bitiruvchi kartochkasiga aylantiriladi; ta’lim, bandlik va tibbiy holat shu yozuvga bog‘lanadi. Importlar JSHSHIR-first merge qiladi, dashboard esa faqat agregat API orqali ma’lumot oladi; shaxsiy ma’lumot dashboardga chiqmaydi.

**Tech Stack:** Node.js 22+, Express 5, `node:sqlite`, vanilla HTML/CSS/JS, Three.js asosidagi mavjud 3D dashboard, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-17-bitiruvchilar-dashboard-admin-design.md`

## Global Constraints

- Asosiy nazorat sonlari: Jami `9 823`, OTM `3 184`, tibbiyot sohasi `283` = OTM `210` + Texnikum `73`.
- 651 Romitan tibbiy ko‘rik yozuvi mavjud bitiruvchilarga bog‘lanadi; yangi dublikat bitiruvchi yaratmasligi kerak.
- OTM bitiruvchisi `Oliy ma’lumotli`; Texnikum/Litsey/Maktab `Oliy ma’lumotli emas`; bo‘sh ta’lim turi majburan toifalanmaydi.
- `Sog‘lom` va `Kasal` faqat real tibbiy ma’lumotdan hisoblanadi; bo‘sh qiymat hech qaysisiga kirmaydi.
- Dashboardda F.I.O., JSHSHIR va telefon ko‘rinmaydi; faqat agregat statistika chiqadi.
- Admin tahrirlari audit logga yoziladi; ommaviy o‘chirish ikki bosqichli tasdiq bilan.
- 3D xarita saqlanadi; hudud tanlanganda agregatlar shu hudud bo‘yicha qayta hisoblanadi.

## Review Focus

- JSHSHIR bo‘sh, lekin F.I.O. bir xil bo‘lgan ikki xil shaxs noto‘g‘ri birlashtirilmasligi kerak.
- 651 Romitan importi mavjud 9 823 yozuvdan tashqari dublikatlar yaratmasligi kerak.
- `OTM`/`ОТМ`/`Oliy ta’lim` kabi variantlar bir xil kategoriya sifatida normallashtirilishi kerak.
- Bo‘sh sog‘liq yoki bandlik qiymati `Sog‘lom`, `Kasal`, `Ishlaydi`, `Ishsiz` hisobiga tushmasligi kerak.
- Tibbiyot yo‘nalishidagi 283 shaxs umumiy 9 823 ustiga qo‘shilib jami sonni oshirmasligi kerak.

---

### Task 1: Yagona bitiruvchi modeli va hisoblash utilitalari

**Files:**
- Create: `bitiruvchilar-admin/lib/graduate-model.js`
- Modify: `bitiruvchilar-admin/lib/graduate-utils.js`
- Create: `bitiruvchilar-admin/test/graduate-model.test.js`

**Interfaces:**
- Consumes: mavjud `canonicalHudud`, `norm`, `statusFlags` utilitalari.
- Produces: `normalizeEducationLevel(value)`, `normalizeEmploymentStatus(value)`, `deriveHealthStatus(row)`, `matchGraduateKey(row)`, `aggregateGraduateRows(rows, filterHudud?)`.

- [ ] **Step 1: Write failing tests**
  - OTM variantlari `OTM`ga normallashsin.
  - Texnikum/Litsey/Maktab alohida qolsin.
  - Bo‘sh ta’lim turi `unknown` bo‘lsin.
  - Tashxis mavjud bo‘lsa `Kasal`; aniq `Sog‘lom` bo‘lsa `Sog‘lom`; bo‘sh bo‘lsa `Aniqlanmagan`.
  - `medical_education=true` agregatda jami sonni oshirmasin.

- [ ] **Step 2: Run tests and confirm failure**
  Run: `cd bitiruvchilar-admin && node --test test/graduate-model.test.js`
  Expected: FAIL because the new module/functions do not exist.

- [ ] **Step 3: Implement minimal normalization and aggregation functions**
  Keep functions pure; no database access in this module.

- [ ] **Step 4: Run tests**
  Run: `cd bitiruvchilar-admin && node --test test/graduate-model.test.js`
  Expected: PASS.

- [ ] **Step 5: Commit**
  `git commit -m "feat: add canonical graduate model utilities"`

### Task 2: SQLite schema migration, JSHSHIR-first identity and audit

**Files:**
- Modify: `bitiruvchilar-admin/server-wrapper.js`
- Create: `bitiruvchilar-admin/test/graduate-db.test.js`

**Interfaces:**
- Consumes: Task 1 normalization functions.
- Produces database fields for `pinfl`, `education_level`, `medical_education`, `medical_education_level`, `education_institution`, `specialty`, `employment_status`, `workplace`, `position`, `order_date`, `order_number`, `health_status`, `diagnosis_category`, plus audit records.

- [ ] **Step 1: Write failing DB tests**
  - Existing SQLite file migrates without deleting rows.
  - `pinfl` exact match wins.
  - If PINFL missing, F.I.O. + hudud + tug‘ilgan sana is fallback.
  - Ambiguous fallback does not silently merge two rows.
  - Audit row is created on admin update.

- [ ] **Step 2: Run tests and verify failure**
  Run: `cd bitiruvchilar-admin && node --test test/graduate-db.test.js`

- [ ] **Step 3: Add schema migration and helper functions**
  Add columns idempotently; create `graduate_audit` table and indexes. Preserve existing production data.

- [ ] **Step 4: Add deterministic match helper**
  Signature: `findGraduateForMerge(db, row) -> {id:number|null, match:'pinfl'|'fallback'|'none'|'ambiguous'}`.

- [ ] **Step 5: Run tests**
  Expected: PASS.

- [ ] **Step 6: Commit**
  `git commit -m "feat: add graduate identity migration and audit"`

### Task 3: Excel merge import — 9823, 651 Romitan, 555 medical, OTM extra

**Files:**
- Create: `bitiruvchilar-admin/lib/import-graduates.js`
- Modify: `bitiruvchilar-admin/server-wrapper.js`
- Modify: `bitiruvchilar-admin/public/excel-panel.js`
- Create: `bitiruvchilar-admin/test/import-graduates.test.js`

**Interfaces:**
- Consumes: Task 2 identity matching.
- Produces: `mergeMainGraduates(rows)`, `mergeMedicalExams(rows)`, `mergeMedicalEducation(rows)`, `mergeHigherEducationExtra(rows)` and preview counters.

- [ ] **Step 1: Write failing import tests**
  - Main 9823 import is merge, not `DELETE + INSERT`.
  - Expected reference fixture produces `9 823` unique and `3 184` OTM.
  - Medical education fixture produces `283`, split `210` OTM + `73` Texnikum, without increasing total.
  - Romitan fixture updates 651 medical exam records without creating graduate duplicates.
  - Preview reports matched/new/ambiguous/error counts before commit.

- [ ] **Step 2: Run tests and verify failure**
  Run: `cd bitiruvchilar-admin && node --test test/import-graduates.test.js`

- [ ] **Step 3: Implement import parsers and merge transaction**
  Reject/flag ambiguous rows instead of guessing.

- [ ] **Step 4: Add admin preview + confirm flow**
  Existing browser-side XLSX reading may remain; payload must be normalized to server-side merge API.

- [ ] **Step 5: Add control-number validation**
  Warn if main import materially differs from 9 823 / 3 184; warn if medical education differs from 283 / 210 / 73. Do not silently recategorize to force those numbers.

- [ ] **Step 6: Run tests**
  Expected: PASS.

- [ ] **Step 7: Commit**
  `git commit -m "feat: merge graduate excel sources safely"`

### Task 4: Admin panel — full editable graduate card

**Files:**
- Modify: `bitiruvchilar-admin/public/excel-panel.html`
- Modify: `bitiruvchilar-admin/public/excel-panel.js`
- Modify: `bitiruvchilar-admin/server-wrapper.js`
- Create: `bitiruvchilar-admin/test/admin-api.test.js`

**Interfaces:**
- Consumes: canonical database model from Tasks 1–3.
- Produces: `GET /api/graduates/:id`, `PATCH /api/graduates/:id`, `DELETE /api/graduates/:id`; list/search/filter endpoints.

- [ ] **Step 1: Write failing API tests**
  Test admin-only access, full-card read, validated patch, audit creation, delete, and operator read-only rejection.

- [ ] **Step 2: Run tests and verify failure**

- [ ] **Step 3: Implement API endpoints**
  Validate allowed enum values and never expose PINFL to public dashboard endpoints.

- [ ] **Step 4: Build four-section edit modal**
  Sections: Shaxsiy ma’lumotlar, Ta’lim, Bandlik, Tibbiy holat. Include OP/OShP, tibbiyot sohasi flag/type, institution/specialty, health/diagnosis fields.

- [ ] **Step 5: Add filtering and clear-module controls**
  Support education, medical education, employment, health, exam, hudud, OP/OShP filters. Keep `TOZALA` confirmation for destructive bulk actions.

- [ ] **Step 6: Run API tests and syntax checks**
  Run: `cd bitiruvchilar-admin && npm run check`
  Expected: PASS.

- [ ] **Step 7: Commit**
  `git commit -m "feat: add complete graduate admin editing"`

### Task 5: Aggregate API and 3D dashboard statistics panel

**Files:**
- Modify: `bitiruvchilar-admin/server-wrapper.js`
- Modify: `bitiruvchilar-admin/public/dashboard-metrics.js`
- Modify or create: `bitiruvchilar-admin/public/dashboard-summary.js`
- Create: `bitiruvchilar-admin/test/dashboard-summary.test.js`

**Interfaces:**
- Consumes: Task 1 `aggregateGraduateRows` and canonical DB fields.
- Produces: `GET /api/public/dashboard-summary?hudud=<canonical>` with only aggregate counts and diagnosis groups.

- [ ] **Step 1: Write failing summary tests**
  Assert keys: `total`, `higher`, `nonHigher`, `working`, `unemployed`, `examined`, `healthy`, `sick`, `medicalEducation.total`, `medicalEducation.otm`, `medicalEducation.technical`, `diagnoses[]`.

- [ ] **Step 2: Add privacy test**
  Response must not contain `fio`, `pinfl`, `telefon` or row-level objects.

- [ ] **Step 3: Implement aggregate endpoint**
  Filter by canonical hudud when present; otherwise region-wide.

- [ ] **Step 4: Restore only the agreed dashboard panel around the preserved 3D map**
  Show the agreed counters and diagnosis statistics; do not restore old unrelated KPI/reytinq/mutaxassislik blocks.

- [ ] **Step 5: Wire 3D region selection to summary refresh**
  Region click updates panel to selected hudud; clear selection restores viloyat totals.

- [ ] **Step 6: Run tests and syntax checks**
  Run: `cd bitiruvchilar-admin && npm run check`
  Expected: PASS.

- [ ] **Step 7: Commit**
  `git commit -m "feat: show canonical graduate stats on 3d dashboard"`

### Task 6: Migration verification, production deployment and acceptance checks

**Files:**
- Modify as needed: `bitiruvchilar-admin/package.json`
- Create: `bitiruvchilar-admin/test/acceptance.test.js`

**Interfaces:**
- Consumes all previous tasks.
- Produces a verified production build and deploy.

- [ ] **Step 1: Add acceptance tests for control numbers**
  Use non-PII fixtures/aggregates to assert 9 823 total, 3 184 OTM, 283 medical education = 210 + 73, and Romitan 651 without duplicate creation.

- [ ] **Step 2: Run full suite**
  Run: `cd bitiruvchilar-admin && npm run check`
  Expected: all tests PASS and syntax checks PASS.

- [ ] **Step 3: Verify migration against a copy of production SQLite**
  Confirm row count, duplicate PINFL count, ambiguous fallback count, and that existing OP/OShP/manual edits are preserved.

- [ ] **Step 4: Deploy to Railway**
  Deploy only after Step 3 passes; keep `/data` volume intact.

- [ ] **Step 5: Verify runtime health and public aggregate endpoint**
  Confirm service SUCCESS, `/health` 200, public summary has only aggregates, and dashboard renders 3D map plus agreed panel.

- [ ] **Step 6: Verify admin flow**
  Open one record, edit one non-sensitive field, save, reload, verify persistence and audit row; then revert the test edit.

- [ ] **Step 7: Commit any final deployment-safe fixes**
  `git commit -m "test: verify graduate dashboard acceptance"`
