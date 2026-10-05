# DMED Production Implementation Plan

Goal: deliver the DMED staff system with admin/institution roles, PostgreSQL persistence, XLSX reporting and Railway production deployment.

Architecture: Express serves the responsive frontend and JSON API. PostgreSQL is durable storage. Signed HttpOnly cookies authenticate requests and institution access is scoped on the server.

Completed:
- Production PostgreSQL backend schema
- Admin and institution authentication/authorization
- Institution and staff CRUD
- Submission status
- Real XLSX export
- Uzbek/Russian responsive interface

Deployment steps:
1. Provision PostgreSQL in Railway Demo production.
2. Deploy cccczzzz778-byte/demo branch dmed-production.
3. Configure database reference and production authentication variables.
4. Configure /api/health and public domain.
5. Verify login, CRUD, role isolation, persistence and XLSX download.
6. Promote the verified branch to main.