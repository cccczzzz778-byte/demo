# DMED Professional Hardening Design

Date: 2026-10-05
Branch: dmed-production
Scope: existing DMED medical staff production application

## 1. Goal

Bring the existing DMED application to a professional production-ready UX and code structure without deleting or resetting existing PostgreSQL data, institution accounts, admin credentials, or medical staff records.

The application must remain simple for institution users while giving the administrator reliable control over institutions, staff drilldown, Excel import/export, and account management.

## 2. Success criteria

The work is complete when:

- Login supports keyboard-first use and password visibility control.
- Pressing Enter in login submits once and behaves exactly like clicking Kirish.
- Password can be shown/hidden with an accessible eye button.
- Caps Lock state can be surfaced on the password field.
- Modal dialogs support Esc to close and sensible initial focus.
- Enter submits supported forms without duplicate submissions.
- Tab order and visible focus states work across the application.
- Staff and institution forms show specific validation errors instead of generic failures.
- PINFL, employment rate, phone, and required text fields are validated client-side and server-side.
- Buttons show loading/disabled states during async actions.
- Admin institution-to-staff drilldown remains intact.
- Excel import preview, import, template download, global export, and institution-scoped export remain intact.
- Empty states, loading states, and destructive-action confirmations are consistent.
- Mobile, tablet, and desktop layouts remain usable.
- Production has baseline HTTP security headers and login rate limiting.
- JWT secret is mandatory in production.
- Current patch-at-start architecture is removed; patch-ui.js and patch-server.js are no longer needed at runtime.
- Existing database rows survive deployment unchanged except for safe schema/default migrations already intended by the application.
- Automated tests and syntax checks pass before Railway deploy is considered complete.

## 3. Architecture direction

Keep the current stack:

- Node.js 20+
- Express
- PostgreSQL
- Vanilla HTML/CSS/JavaScript
- XLSX for current Excel flows
- JWT in secure httpOnly cookie

Do not introduce React, Vue, or another SPA framework. The current application is small enough that a clean vanilla frontend is simpler, cheaper to maintain, and reduces migration risk.

Refactor away from runtime source patching. Final runtime should be:

1. seed-test.js only if the test account is intentionally retained for production testing,
2. server.js,
3. static frontend assets from public/.

The production server should not rewrite source files before starting.

## 4. Target code structure

Recommended structure:

```text
server.js
lib/
  staff-import.js
  staff-scope.js
  validation.js
public/
  index.html
  app.css
  app.js
  ui.js
  auth.js
  staff.js
  institutions.js
  import.js
  reports.js
tests/
  staff-import.test.js
  staff-scope.test.js
  validation.test.js
  auth-ui-contract.test.js
```

The exact frontend split may be adjusted during implementation if fewer files are clearer, but the key rule is that HTML, CSS, and JavaScript are no longer maintained as one giant inline block or patched at runtime.

## 5. Login UX

### Password visibility

- Add an eye toggle inside the password field container.
- The toggle changes `type=password` to `type=text` and back.
- The control must have an accessible label such as “Parolni ko‘rsatish” / “Parolni yashirish”.
- It must be keyboard-focusable.

### Keyboard submit

- Login should be a real `<form>` with a submit event.
- Enter from username or password submits the form once.
- Prevent duplicate requests while one login attempt is in progress.

### Login states

- Empty username or password is rejected locally before network request.
- During submit, the button is disabled and shows a loading state.
- Invalid credentials show a precise user-safe message.
- Network/server failure is distinguished from invalid credentials.
- On success, login error state is cleared.

### Caps Lock

- While typing in the password field, detect `event.getModifierState('CapsLock')` when available.
- Display a non-blocking warning.

## 6. Keyboard and accessibility behavior

- All interactive controls must be reachable with Tab.
- Visible `:focus-visible` styles must be present.
- Esc closes an open modal unless a destructive action is currently being committed.
- Opening a modal focuses the first relevant input.
- Closing a modal restores focus to the element that opened it when practical.
- Enter submits forms, not arbitrary buttons.
- Icon-only edit/delete/key buttons receive `title` and `aria-label` text.
- Tables retain semantic `<table>`, `<thead>`, `<tbody>` structure.
- Language toggle remains keyboard accessible.

## 7. Form validation

### Staff form

Client and server rules:

- Institution: required for admin-created staff.
- Full name: required, trimmed, bounded length.
- PINFL: exactly 14 digits.
- Position: required, trimmed, bounded length.
- Specialty: optional but bounded.
- Employment rate: numeric, positive, accepts comma or dot on input; normalize to dot for storage.
- Phone: optional, but when provided must be a plausible phone string and length-bounded.
- Note: optional and length-bounded.

Errors must be returned with a stable code and rendered beside or near the offending field.

### Institution form

- District: required and bounded.
- Name: required and bounded.
- Type: required.
- Phone: optional but validated when present.
- Note: optional and bounded.

### Account form

- Username: required, normalized/trimmed, bounded.
- Password: minimum 8 characters.
- Password visibility toggle should also be available when admin creates/updates institution credentials.

## 8. Async UX

For login, save, delete, submit, import, account creation, and other network actions:

- Disable the action button while request is active.
- Prevent duplicate submit.
- Show clear progress text/spinner state.
- Restore button state on failure.
- Show success feedback where the result is not otherwise obvious.

## 9. Admin institution drilldown

Preserve and polish current behavior:

- Institution name in admin Muassasalar table is clickable.
- Clicking opens Xodimlar view scoped to that institution.
- Selected institution is shown as a visible badge/header.
- “Barcha xodimlar” clears the scope.
- Search runs within the current scope.
- Excel export respects current scope.
- Empty institution staff list shows a friendly empty-state message.

## 10. Staff and institution tables

- Sticky header for long tables.
- Responsive horizontal scroll on narrow screens.
- Clear empty states.
- Consistent action icons and tooltips.
- Prevent text overlap for long names.
- Maintain current search behavior.
- Add staff count where useful in admin institution drilldown.

Pagination is not required in this phase unless real production data size makes the current rendering unusable during implementation verification.

## 11. Excel import/export

Preserve existing data contract and improve UX.

Import:

- Template download remains available to institution users.
- Preview is required before import.
- Show total rows, valid rows, error rows.
- Show row-specific error text.
- Reject malformed workbook safely.
- Enforce file size and row count limits.
- PINFL duplicates in file and database remain blocked.
- Employment rate accepts `1`, `0,5`, `0.5`, `0,25`, etc.

Export:

- Institution account exports only its own staff.
- Admin default export includes all staff.
- Admin scoped export includes only selected institution.
- Column order remains aligned with the requested medical staff template.

## 12. Security hardening

### Required

- Add baseline security headers using Helmet or equivalent explicit middleware.
- Add login rate limiting by IP with a reasonable window and maximum attempts.
- `JWT_SECRET` must be required in production; no insecure fallback in production.
- Continue using httpOnly secure cookies in production.
- Keep SameSite policy appropriate for same-site app flow.
- Bound request body sizes.
- Bound text field lengths server-side.
- Do not expose password hashes or secrets to frontend responses.
- Keep authorization checks server-side for admin/institution separation.

### Deferred

The following are useful but not required for this hardening pass unless implementation reveals a direct need:

- full audit log subsystem,
- forced password rotation,
- multi-factor authentication,
- CSRF token framework,
- advanced WAF/bot protection.

## 13. Error handling

Introduce consistent JSON error responses with stable codes, for example:

```json
{ "error": "invalid_pinfl", "field": "pinfl" }
```

Frontend maps known codes to Uzbek/Russian user messages.

Unknown server errors should show a generic safe message and be logged server-side without leaking internals.

## 14. Visual design

Retain the existing green DMED identity but polish it:

- consistent spacing scale,
- consistent 8–12 px border radius family,
- stronger hierarchy between page title, section title, and table labels,
- uniform button heights,
- visible focus rings,
- better disabled/loading states,
- improved mobile nav behavior,
- modal width and scrolling suitable for 9:16 mobile screens,
- no decorative redesign that makes workflows slower.

Professional means predictable and clean, not visually heavy.

## 15. Data preservation and migration

Do not drop tables or recreate the database.

Safe changes may use:

- `CREATE TABLE IF NOT EXISTS`,
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`,
- safe default changes,
- normalization updates already required by product rules.

No migration may delete staff, institution, or user rows.

## 16. Test strategy

Use TDD for behavior changes.

Minimum automated coverage:

- employment rate normalization,
- PINFL validation,
- institution staff scope,
- admin scoped export selection,
- production secret requirement helper/contract,
- login rate-limit configuration helper/contract where testable,
- validation helpers for staff/institution/account inputs,
- frontend contract tests for required login controls and keyboard hooks if no browser test runner is introduced.

Before completion:

- `npm test` passes,
- `node --check` passes for runtime JS files,
- Railway deploy is SUCCESS,
- runtime logs show server started normally,
- health endpoint returns healthy status,
- admin login works,
- test institution login works,
- institution Excel import/export still works,
- admin institution drilldown and scoped export work.

## 17. Deployment approach

1. Implement on `dmed-production`.
2. Keep PostgreSQL service untouched.
3. Make code commits in small verifiable steps.
4. Allow Railway branch deploys to run pre-deploy tests.
5. Do not claim completion until final production deployment is SUCCESS and runtime verification passes.

## 18. Non-goals

This phase does not rebuild the app in another framework, replace PostgreSQL, redesign the business model, remove the test account unless explicitly requested, add new healthcare workflow modules, or change existing institution/staff ownership rules.

## 19. Acceptance checklist

- [ ] Password eye toggle works on login.
- [ ] Enter submits login once.
- [ ] Caps Lock warning works where supported.
- [ ] Esc closes modals.
- [ ] Modal focus behavior is sane.
- [ ] Tab/focus-visible works.
- [ ] Staff form validation is specific.
- [ ] Institution form validation is specific.
- [ ] Account form supports password visibility.
- [ ] Async actions cannot double-submit.
- [ ] Admin drilldown still works.
- [ ] Scoped Excel export works.
- [ ] Excel import still works.
- [ ] Responsive UI is polished.
- [ ] Security headers enabled.
- [ ] Login rate limit enabled.
- [ ] Production JWT secret is mandatory.
- [ ] Runtime patch scripts removed from production start path.
- [ ] Existing DB data preserved.
- [ ] Automated tests pass.
- [ ] Railway production deployment is SUCCESS.
