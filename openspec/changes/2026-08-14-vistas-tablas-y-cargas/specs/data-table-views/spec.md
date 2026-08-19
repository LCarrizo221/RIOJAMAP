---
name: data-table-views
description: Paginated, filterable read-only list views for the 14 import tables and ReportesHistorico.
---

# Data Table List Views

## ADDED Requirements

### Requirement: Data Table List Views

The system SHALL expose `GET /api/import/tables/:tableName` for the 14 tables: paginated rows with filters `expediente`, `nombre`, `fecha_carga`, `es_eventual`, `page`, `limit`. `:tableName` MUST be validated against `GENERIC_TABLES ∪ PERSON_TABLES`. ReportesHistorico reuses the existing paginated endpoint; the UI renders it as a tab.

#### Scenario: Paginate a valid table

- GIVEN table "expedientes" with 120 rows
- WHEN `GET /api/import/tables/expedientes?page=2&limit=50`
- THEN 200 with 50 rows and pagination `{ page: 2, limit: 50, total: 120, totalPages: 3 }`

#### Scenario: Filter eventual rows

- GIVEN rows with `es_eventual=true` mixed with `false`
- WHEN `GET /api/import/tables/piniHerrera?es_eventual=true`
- THEN only eventual rows are returned

#### Scenario: Reject unknown table

- GIVEN `:tableName` = "hackers"
- WHEN `GET /api/import/tables/hackers`
- THEN 400 `INVALID_TABLE` (whitelist enforced)
