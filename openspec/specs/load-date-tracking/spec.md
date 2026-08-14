# Load-Date & Eventual Persistence

## Requirements

### Requirement: Load-Date & Eventual Persistence

The system SHALL add `fecha_carga DateTime?` and `es_eventual Boolean @default(false)` to all 14 import models via a Prisma migration. `fecha_carga` SHALL record each row's load date; `es_eventual` SHALL mark rows loaded as eventual movements.

#### Scenario: Existing rows keep null load date

- GIVEN rows persisted before the migration
- WHEN migration adds `fecha_carga DateTime?`
- THEN existing rows carry `fecha_carga = null`
- AND all rows default `es_eventual = false`

#### Scenario: Absent fecha_carga uses effective import date

- GIVEN an import without `fecha_carga` and without `import_date`
- WHEN a row is persisted
- THEN `fecha_carga` equals the effective import date (current date/time)

## Decisions

| # | Decision |
|---|----------|
| 3 | Default `fecha_carga` when absent: effective `import_date` — `new Date()` when absent, **not midnight** (evidence contradicts proposal). Manual rows: current date. |
