# DMED Production Design

## Goal
A production-ready bilingual medical staff data collection system for Bukhara healthcare institutions, deployed from `cccczzzz778-byte/demo` to Railway `Demo / production`.

## Roles
- Admin: manages institutions, institution credentials, all staff, submission status and reports.
- Institution: sees and manages only its own staff and can submit its dataset.

## Data
PostgreSQL stores institutions, users and staff. PINFL is exactly 14 digits and globally unique. Institution deletion cascades to its users and staff.

## Security
Passwords are bcrypt hashes. Authentication uses 12-hour signed JWTs in HttpOnly SameSite cookies. Server-side role and institution scoping is mandatory on every protected data endpoint.

## UX
Responsive Uzbek/Russian interface with dashboard, staff, institution management and real XLSX report download.

## Deployment
GitHub branch is validated before promotion to main. Railway production uses PostgreSQL and environment secrets for admin bootstrap and JWT signing. `/api/health` is the health endpoint.