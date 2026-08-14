---
name: manual-row-entry
description: ADMIN manual row creation per table, versioned and audit-logged.
---

# Manual Row Creation

## ADDED Requirements

### Requirement: Manual Row Creation

The system SHALL expose `POST /api/import/tables/:tableName/rows` (ADMIN only). Body: standard row fields plus optional `fecha_carga` (default current date) and `es_eventual` (default `false`). Type2 tables SHALL require a valid `person_id`. Creation SHALL reuse VersioningService (Type1 create / Type2 versioned insert) and SHALL audit to ReportesHistorico.

#### Scenario: Create Type2 row manually

- GIVEN an ADMIN token and `person_id=3`
- WHEN POST to piniHerrera rows { expediente: "P-1", monto_total: 100 }
- THEN a new row is created with version 1, `fecha_carga` = current date, `es_eventual=false`
- AND an audit entry is written

#### Scenario: Type1 manual create conflicts on existing expediente

- GIVEN existing expedientes row { expediente: "EXP-42" }
- WHEN POST to expedientes rows with expediente "EXP-42"
- THEN 409 conflict; existing row untouched (editing is out of scope)

#### Scenario: Manual eventual row

- GIVEN a manual create with `es_eventual=true`
- THEN the row persists with the flag set
- AND views render the eventual badge and the filter includes it

## Decisions

| # | Decision |
|---|----------|
| 2 | Manual rows set `es_eventual`/`fecha_carga`? **Yes.** `fecha_carga` defaults to current date; `es_eventual` optional (default `false`). Type1 manual create with an existing `expediente` → 409 (upsert would overwrite = edit, out of scope). |
