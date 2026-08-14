# Design: Data Table Views, Manual Row Entry & Eventual Movements

## Technical Approach

Extend the existing pipeline — no rewrite. Two read/write endpoints for the 14 tables sit beside the current import endpoints, reusing `GENERIC_TABLES`/`PERSON_TABLES` whitelists from `types.ts`, `VersioningService` for writes, `ReportesHistoricoService` for audit, and the reportes-historico pagination shape. `ImportExcelService` gains an optional `nro_expediente`/`fecha_carga` mode that tags matching rows `es_eventual=true`. Frontend: ImportPage gains tabs (Cargar / Ver tablas) with a generic `DataTable` rendered for all 14 tables + ReportesHistorico. All decisions honor the spec's decision log (spec.md lines 7–13).

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|--------------|-----------|
| 1 | List pagination order | `orderBy: { id: 'desc' }` | `createdAt` desc + new index | PK index serves ordering free; avoids 13 new `createdAt` indexes |
| 2 | Type2 filter indexes | `@@index([es_eventual])`, `@@index([fecha_carga])` on 8 Type2 only | Index all 14 | Type1 is one row per `@unique` expediente — small; spec targets Type2 growth |
| 3 | List query placement | New `TableQueryService` (`list`, `countEventual`) | Inline in controller, extend VersioningService | Thin-controller convention; VersioningService is write-focused |
| 4 | Dynamic table dispatch | Whitelist `GENERIC_TABLES ∪ PERSON_TABLES` → else 400 `INVALID_TABLE` | Prisma `$queryRaw` with table name | Matches existing `getPersonVersions` guard; blocks `(prisma as any)[tableName]` injection |
| 5 | ADMIN gate | `authorize('ADMIN')` (exists in `middleware/auth.ts`) on both POSTs | New middleware | Zero new auth code; 403 `FORBIDDEN` shape already standard |
| 6 | Type1 manual create | `findUnique` pre-check → 409 `EXPEDIENTE_EXISTS`; then `createVersionedRow` v1 `imported_from='MANUAL'` | `upsertGenericRow` | Pre-check makes upsert's update branch unreachable — editing stays out of scope |
| 7 | Eventual flag plumbing | `es_eventual`/`fecha_carga` flow through `_toRowData(row, ctx)` → versioning rowData | Separate column at controller | Type1 upsert update-branch carries `es_eventual` naturally: eventual import → true, normal re-import → false (spec scenario) |
| 8 | Eventual badge count | `eventual_total` computed in list response | Second endpoint | One round-trip; count is cheap (`where: { es_eventual: true }`) |

## Data Flow

```
POST /api/import (ADMIN, multer) ──→ ImportExcelService.importFile(buffer, importDate, file, { nro_expediente?, fecha_carga? })
        └─ per row: isEventual = exp.trim().toLowerCase() === nro_expediente.trim().toLowerCase()
           └─ _toRowData(row, { fecha_carga: opts.fecha_carga ?? importDate, es_eventual: isEventual })
              → VersioningService (Type1 upsert / Type2 create) → ReportesHistorico.log()

GET  /tables/:tableName (authenticate) → TableQueryService.list → { data, pagination, eventual_total }
POST /tables/:tableName/rows (ADMIN)   → whitelist → Type1 409-precheck | Type2 person_id validate
                                       → VersioningService.createVersionedRow('MANUAL') → audit → 201
```

`fecha_carga` effective value: `opts.fecha_carga ?? importDate` where `importDate = import_date ?? new Date()` (spec decision #3).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `server/prisma/schema.prisma` | Modify | `fecha_carga DateTime?` + `es_eventual Boolean @default(false)` on 14 models; Type2 `@@index([es_eventual])`, `@@index([fecha_carga])` |
| `server/src/services/import/types.ts` | Modify | `ImportSummary.eventual_matched?: number` |
| `server/src/services/import/ImportExcelService.ts` | Modify | `importFile` opts param; eventual predicate; `_toRowData` ctx; summary counter |
| `server/src/services/import/TableQueryService.ts` | Create | `list(tableName, q)` + `countEventual(tableName)` via whitelist + `(prisma as any)[tableName]` |
| `server/src/schemas/import.ts` | Modify | `importRequestSchema` + `nro_expediente`/`fecha_carga`; summary + `eventual_matched`; `tableListQuery/ResponseSchema`, `createTableRowSchema` (+person) |
| `server/src/controllers/importController.ts` | Modify | `listTableRows`, `createTableRow`; `uploadFile` passes opts |
| `server/src/routes/import.ts` | Modify | `GET /tables/:tableName` (authenticate); `POST /tables/:tableName/rows` + `POST /` with `authorize('ADMIN')` |
| `server/tests/api/importRoutes.test.ts`, `server/tests/import/` | Modify | 403/400/409/eventual tests (see Testing) |
| `client/src/contracts/import.ts` | Modify | `GENERIC_TABLES`/`PERSON_TABLES` mirror; `TableRowContract` (+person); `TableListResponseContract`; `CreateRowResponseContract`; summary + `eventual_matched: z.number().optional()` (`.strict()` otherwise rejects) |
| `client/src/api/tables.ts` | Create | `getTableRows`, `createTableRow` (validateResponse pattern) |
| `client/src/components/ImportPage.tsx` | Modify | Tabs Cargar / Ver tablas; pass `user.role` |
| `client/src/components/import/TableBrowser.tsx`, `DataTable.tsx`, `AddRowModal.tsx` | Create | Selector, generic table (columns config + filters + pagination + badge + "+ Agregar fila"), manual-create modal |
| `client/src/api/__tests__/tables.test.ts` | Create | Contract + URL tests |

Tailwind v4 rules apply: no config file; inline utilities with existing palette (`bg-[#0c0c0e]`, `text-amber-500`, `font-mono uppercase tracking-widest`); `@theme` untouched.

## Interfaces / Contracts

```ts
// server/src/schemas/import.ts (mirrored in client contracts/import.ts, .strict())
const tableListQuerySchema = z.object({
  expediente: z.string().optional(), nombre: z.string().optional(),
  fecha_carga: z.string().optional(),              // ISO day → [startOfDay, endOfDay]
  es_eventual: z.enum(['true','false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
const tableListResponseSchema = z.object({
  table_name: z.string(), data: z.array(z.record(z.unknown())),
  pagination: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }),
  eventual_total: z.number(),
});
// POST rows body: baseTableRowSchema minus id/version/imported_from/createdAt,
// + fecha_carga optional, es_eventual optional, person_id required for Type2.
```

`createTableRow` flow: whitelist → Type1: `findUnique({ expediente })` exists → 409; Type2: `prisma.person.findUnique(person_id)` missing → 400 `INVALID_PERSON`, else version = `getLatestVersion + 1` → `createVersionedRow(table, { ...body, person_id }, v, 'MANUAL')` → `historicoService.log({ matched_table_type, matched_table_name, version_created, fecha_importacion: fecha_carga })` → 201 with created row.

## Excel Format (eventual movimientos)

No new format — reuses existing single-sheet parsing: `expediente` column (aliases `numerodeexpte`/`nrodeexpte`/`n°deexpte` already mapped), plus `nombre`/`referente`/`detalle`/`monto_total`/`monto_parcial`/`saldo` optional. Every row whose parsed expediente equals `nro_expediente` (trim, case-insensitive) persists `es_eventual=true`; others `false`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Jest, server) | `TableQueryService` filters/pagination; eventual predicate; summary counter | New `TableQueryService.test.ts`; extend `ImportExcelService.test.ts`/`.integration.test.ts` with mocked services |
| API (supertest, server) | 403 USER on both POSTs; 400 `INVALID_TABLE`; list shape + pagination; 409 Type1 conflict; `eventual_matched` in summary | Extend `server/tests/api/importRoutes.test.ts` |
| Client (Vitest) | `getTableRows`/`createTableRow` URLs, contract validation (incl. `eventual_matched`), error mapping | New `client/src/api/__tests__/tables.test.ts` |
| Type gate | `tsc --noEmit` both packages | `npm run lint` (server + client) |

Verification commands: `cd server && npm run lint && npm test`; `cd client && npm run lint && npm test`; `npx prisma migrate dev` + `prisma generate`. strict_tdd: false — RED tests are written alongside, not before.

## Threat Matrix

| Boundary | Applicability | Design response | Planned tests |
|---|---|---|---|
| Documentation-like paths | N/A — no file classification | — | — |
| Git repository selection | N/A — no VCS calls | — | — |
| Commit state | N/A — no commits | — | — |
| Push state | N/A — no pushes | — | — |
| PR commands | N/A — no PR automation | — | — |

Routing note: `:tableName` drives dynamic Prisma access — whitelist-enforced (400 `INVALID_TABLE`), RED-tested via supertest.

## Migration / Rollout

`prisma migrate dev --name load_date_eventual` — additive nullable/`@default(false)` columns; existing rows keep `fecha_carga = null`, `es_eventual = false` (spec scenario). No data backfill. Rollback: `prisma migrate resolve` revert + `git revert` of routes/UI; endpoints additive behind `authenticate`.

## Open Questions

- [ ] `fecha_carga` filter granularity: exact day vs. `YYYY-MM` prefix — design assumes exact day (range over calendar day).
