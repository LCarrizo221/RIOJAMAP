# Tasks: Data Table Views, Manual Row Entry & Eventual Movements

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,150 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → 4 |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Migration + read endpoints | PR 1 | `npx jest tests/import/TableQueryService.test.ts tests/api/importRoutes.test.ts` | `prisma migrate dev`; GET `/tables/expedientes` | `git revert` + `migrate resolve` |
| 2 | Write paths + ADMIN gates | PR 2 | `npx jest tests/api/importRoutes.test.ts` | POST import w/ `nro_expediente`; POST rows | `git revert` |
| 3 | Contracts + API | PR 3 | `npx vitest run src/api/__tests__/tables.test.ts` | N/A — fetch mocked, no real endpoint | `git revert` |
| 4 | UI tabs/views/modal | PR 4 | `npx tsc --noEmit` | Manual UI run | `git revert` |

## Slice 1 — Migration & Read Endpoints (PR 1)

Done: R1 null load date; R2 paginate/filter/reject; R3 USER list 200.

- [x] 1.1 `server/prisma/schema.prisma`: add `fecha_carga` + `es_eventual @default(false)` to 14 models; Type2 `@@index([es_eventual])`/`@@index([fecha_carga])`; `npx prisma migrate dev --name load_date_eventual` + `prisma generate`
- [x] 1.2 `server/src/services/import/types.ts`: `ImportSummary.eventual_matched?: number`
- [x] 1.3 Create `TableQueryService.ts`: `list()` + `countEventual()`; whitelist `GENERIC_TABLES ∪ PERSON_TABLES`; `orderBy id desc`; expediente/nombre/es_eventual/fecha_carga filters; pagination
- [x] 1.4 `schemas/import.ts`: `tableListQuerySchema` + `tableListResponseSchema` (+`eventual_total`)
- [x] 1.5 `importController.ts`: `listTableRows` (400 `INVALID_TABLE`, 500 `FETCH_ERROR`)
- [x] 1.6 `server/src/routes/import.ts`: `GET /tables/:tableName` (authenticate)
- [x] 1.7 Jest `TableQueryService.test.ts`: 120→3 pages; es_eventual filter; unknown table
- [x] 1.8 supertest: 400 `INVALID_TABLE`; USER 200; schema shape

## Slice 2 — Write Paths (PR 2)

Done: R3 403, R4 tag/reset/`eventual_matched`, R5 create/409.

- [x] 2.1 `schemas/import.ts`: `importRequestSchema` + `nro_expediente`/`fecha_carga`; summary + `eventual_matched`; `createTableRowSchema` (minus id/version/imported_from/createdAt, + `fecha_carga`/`es_eventual`, Type2 `person_id`)
- [x] 2.2 `ImportExcelService.ts`: `importFile(..., opts)`; predicate (trim, case-insensitive); `_toRowData(row, ctx)`; counter
- [x] 2.3 `importController.ts`: `uploadFile` passes opts; `createTableRow` — Type1 409, Type2 400 `INVALID_PERSON`, `createVersionedRow(..., 'MANUAL')` + audit → 201
- [x] 2.4 `routes/import.ts`: `authorize('ADMIN')` on `POST /`; `POST /tables/:tableName/rows` (authenticate + ADMIN)
- [x] 2.5 supertest: USER 403 (no audit); Type1 409; Type2 201 + audit; `eventual_matched`; reset re-import

## Slice 3 — Client Contracts & API (PR 3)

Done: contracts mirror server `.strict()` + eventual fields; `postImport` eventual opts; `tables.ts` client API; vitest + `tsc --noEmit` green.

- [x] 3.1 `client/src/contracts/import.ts`: espejar whitelists (`TYPE1_TABLES`, `TYPE2_TABLES`, `REPORTES_HISTORICO`, `ALL_IMPORT_TABLES`); `TableListQueryContract`, `TableListResponseContract` (+`eventual_total`), `TableRowContract` (+person_id), `CreateRowResponseContract`, `CreateTableRowContract`, `ImportRequestContract`, summary +`eventual_matched` — todos `.strict()`
- [x] 3.2 Create `client/src/api/tables.ts`: `getTableRows`/`createTableRow` via `validateResponse`; manejo 400/403/409/500 con mensajes del code server
- [x] 3.3 `client/src/api/import.ts`: `postImport(file, options)` envía `nro_expediente`/`fecha_carga` (FormData); respuesta tipada con `eventual_matched`
- [x] 3.4 Vitest `tables.test.ts`: URLs, contract parse, 400 `INVALID_TABLE`, 409 `EXPEDIENTE_EXISTS`, 403 `FORBIDDEN`
- [x] 3.5 Gate: `cd client && npm run lint` + `npx vitest run src/api/__tests__/tables.test.ts`

## Slice 4 — UI (PR 4)

Done: tabs Cargar/Ver tablas (ADMIN-only upload); TableBrowser 15 tabs + ReportesHistorico readonly; DataTable + AddRowModal; `tsc --noEmit` + vitest green.

- [x] 4.1 `ImportPage.tsx`: tabs Cargar / Ver tablas; pass `user.role`
- [x] 4.2 Create `TableBrowser.tsx`: 14-table selector + ReportesHistorico
- [x] 4.3 Create `DataTable.tsx`: columns config, filters, pagination, badge, `eventual_total`
- [x] 4.4 Create `AddRowModal.tsx`: form; Type2 `person_id`; es_eventual toggle
- [x] 4.5 Verify `npm run lint && npm test` + manual UI

## Dependencies

PR 1 → 4, child base = parent branch. Slice 2 needs migration columns; Slice 3 mirrors 1–2; Slice 4 consumes `api/tables.ts`.
