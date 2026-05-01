# Strata API Docs

This folder contains the API endpoints that are currently implemented and ready to use in this repository.

Use these documents as the implementation reference for the current codebase.

## Index

- [00-overview.md](/home/aminh/projects/strata/docs/api/00-overview.md)
- [01-health.md](/home/aminh/projects/strata/docs/api/01-health.md)
- [02-authentication.md](/home/aminh/projects/strata/docs/api/02-authentication.md)
- [03-admin-residences.md](/home/aminh/projects/strata/docs/api/03-admin-residences.md)
- [04-admin-blocks.md](/home/aminh/projects/strata/docs/api/04-admin-blocks.md)
- [05-admin-units.md](/home/aminh/projects/strata/docs/api/05-admin-units.md)
- [06-admin-resident-management.md](/home/aminh/projects/strata/docs/api/06-admin-resident-management.md)
- [07-admin-imports.md](/home/aminh/projects/strata/docs/api/07-admin-imports.md)
- [08-resident-portal.md](/home/aminh/projects/strata/docs/api/08-resident-portal.md)

## Quick Summary

### Public

- `GET /health`
- `GET /health/db`
- `POST /auth/admin/login`
- `POST /auth/resident/login`

### Admin

- `GET /admin/residences`
- `GET /admin/residences/{residence_id}`
- `PATCH /admin/residences/{residence_id}`
- `POST /admin/blocks`
- `GET /admin/blocks`
- `GET /admin/blocks/{block_id}`
- `PATCH /admin/blocks/{block_id}`
- `POST /admin/units`
- `GET /admin/units`
- `GET /admin/units/{unit_id}`
- `PATCH /admin/units/{unit_id}`
- `POST /admin/residents`
- `GET /admin/residents`
- `PATCH /admin/residents/{user_id}`
- `GET /admin/units/{unit_id}/residents`
- `POST /admin/units/{unit_id}/residents`
- `DELETE /admin/units/{unit_id}/residents/{user_id}`
- `POST /admin/imports/units`
- `GET /admin/imports/{batch_id}`

### Resident

- `GET /resident/units`
- `GET /resident/units/{unit_id}/balance`
- `GET /resident/units/{unit_id}/charges`
- `GET /resident/units/{unit_id}/payments`
- `POST /resident/units/{unit_id}/payments`
- `GET /resident/payments/{payment_id}/proof`
- `GET /resident/units/{unit_id}/installment-plan`
