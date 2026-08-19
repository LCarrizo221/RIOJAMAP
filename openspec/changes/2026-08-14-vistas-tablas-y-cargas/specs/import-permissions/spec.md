---
name: import-permissions
description: Role-based access — ADMIN writes (imports and manual rows), ADMIN and USER read.
---

# Role-Based Import Permissions

## ADDED Requirements

### Requirement: Role-Based Import Permissions

Write endpoints SHALL require ADMIN: `POST /api/import` and `POST /api/import/tables/:tableName/rows`. Read endpoints SHALL remain open to ADMIN and USER. USER write attempts MUST receive 403 `FORBIDDEN`; no row is persisted.

#### Scenario: USER blocked from loading

- GIVEN a USER token and a valid .xlsx
- WHEN `POST /api/import`
- THEN 403 `FORBIDDEN`
- AND no row is persisted, no audit entry created

#### Scenario: USER reads table lists

- GIVEN a USER token
- WHEN `GET /api/import/tables/expedientes`
- THEN 200 with rows
