---
id: 2026-08-14-vistas-tablas-y-cargas
title: Data Table Views, Manual Row Entry & Eventual Movements
---

# Proposal: Data Table Views, Manual Row Entry & Eventual Movements

## Summary

Paginated read-only views for the 14 data tables + ReportesHistorico inside ImportPage (tabs: Cargar / Ver tablas). ADMIN loads (Excel, both modes, + manual rows); USER reads only. `fecha_carga` and `es_eventual` persisted via Prisma migrations; import pipeline extended, not rewritten.

## Problem

Loaded data is invisible — no list endpoint exists for the 14 tables. Daily movements need a way to tag matching rows as eventual and record their load date. No manual fallback exists for row-by-row loading.

## Success Criteria

- [ ] Paginated, filterable lists for the 14 tables + ReportesHistorico (expediente, nombre, fecha_carga, es_eventual)
- [ ] ADMIN creates rows per table (versioned + audit-logged)
- [ ] Eventual import tags matching rows `es_eventual=true`; badge + filter in views
- [ ] `fecha_carga` on every row of the 14 tables
- [ ] USER blocked (403) from load/create endpoints; existing endpoints unchanged

## Scope

### In
- List: `GET /api/import/tables/:tableName` (+ pagination/filters); reportes-historico reuses existing endpoint
- Create: `POST /api/import/tables/:tableName/rows` (ADMIN, via VersioningService + audit)
- Eventual mode: POST /api/import with `nro_expediente` + `fecha_carga`
- Migrations: `fecha_carga DateTime?`, `es_eventual Boolean @default(false)` on the 14 models
- UI: ImportPage tabs, DataTable views, badge, filters, "+ Agregar fila"
- Zod contracts (server `schemas/import.ts` + client `contracts/import.ts`)

### Out
- Row edit/delete, Obra/map, auth, fuzzy matching, bulk historical import

## Capabilities

### New
- `data-table-views`: paginated read-only listings + filters (14 tables, ReportesHistorico)
- `manual-row-entry`: ADMIN row creation, versioned + audited
- `eventual-movements`: eventual import mode → `es_eventual=true` on matching rows
- `load-date-tracking`: `fecha_carga` persisted across the 14 tables
- `import-permissions`: ADMIN-only load/create; USER read-only

### Modified
- None — import pipeline has no main spec (excel-import-feature unmerged); new capabilities extend its change-level spec.

## Approach

Extend ImportExcelService/MatchingService/VersioningService — no rewrite. Optional `nro_expediente`/`fecha_carga` on POST /api/import; rows matching the number persist with `es_eventual=true`; others match as today. List endpoints reuse the reportes-historico pagination pattern with a whitelist (GENERIC_TABLES/PERSON_TABLES). Manual creation reuses VersioningService (Type1 upsert / Type2 versioned insert) + audit log.

## Affected Areas

| Area | Impact |
|---|---|
| `server/prisma/schema.prisma`, `migrations/` | Modified/New |
| `server/src/services/import/*` | Modified |
| `server/src/controllers/importController.ts`, `routes/import.ts`, `schemas/import.ts` | Modified |
| `client/src/contracts/import.ts` | Modified |
| `client/src/components/ImportPage.tsx` + new DataTable views | Modified/New |

## Risks

| Risk | Likelihood |
|---|---|
| es_eventual × Type1 `@unique` expediente (upsert vs. tag semantics) | High |
| Generic 14-table dispatch accepts invalid table names | Med |
| Type2 row growth slows list queries | Med |
| Scope creep into editing/deleting | Low |

## Rollback

Revert migrations via `prisma migrate`; `git revert` routes/controllers/UI. Additive endpoints behind `authenticate` — prior behavior untouched.

## Open Questions

1. es_eventual on Type1: new row or flag on the upserted row?
2. Manual rows: can they set es_eventual/fecha_carga?
3. Default fecha_carga when absent?

## Dependencies

Existing excel-import pipeline (unarchived); Prisma 5.22, Express, Zod, React 19, Tailwind v4.
