# Eventual Import Mode

## Requirements

### Requirement: Eventual Import Mode

`POST /api/import` MAY accept `nro_expediente` and `fecha_carga`. Rows whose parsed `expediente` equals `nro_expediente` (trimmed, case-insensitive) SHALL persist with `es_eventual=true`; all others persist with `es_eventual=false`. Matching, versioning, and audit behave exactly as today. The response summary MAY include an `eventual_matched` count.

#### Scenario: Type1 row tagged on the upserted row

- GIVEN existing expedientes row { expediente: "EXP-42", version: 2 }
- WHEN eventual import with `nro_expediente="EXP-42"`
- THEN the same row is upserted (version=3) with `es_eventual=true` and `fecha_carga` set
- AND no second expediente row is created (unique constraint holds)

#### Scenario: Normal re-import resets the flag

- GIVEN row { expediente: "EXP-42", es_eventual: true }
- WHEN a normal import (no `nro_expediente`) persists "EXP-42"
- THEN `es_eventual=false` on the upserted Type1 row (or the new Type2 row)

#### Scenario: Type2 row tagged eventual

- GIVEN a Type2 import matched by name, row carries expediente "P-7"
- WHEN eventual import with `nro_expediente="P-7"`
- THEN a new versioned row is created with `es_eventual=true`

## Decisions

| # | Decision |
|---|----------|
| 1 | `es_eventual` on Type1: flag on the **upserted** row; prior value replaced. A new row is impossible: `expediente @unique` + update-in-place upsert. A later **normal** import resets the flag to `false`. |
