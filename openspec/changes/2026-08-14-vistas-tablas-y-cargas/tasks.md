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

- [ ] 1.1 `server/prisma/schema.prisma`: add `fecha_carga` + `es_eventual @default(false)` to 14 models; Type2 `@@index([es_eventual])`/`@@index([fecha_carga])`; `npx prisma migrate dev --name load_date_eventual` + `prisma generate`
- [ ] 1.2 `server/src/services/import/types.ts`: `ImportSummary.eventual_matched?: number`
- [ ] 1.3 Create `TableQueryService.ts`: `list()` + `countEventual()`; whitelist `GENERIC_TABLES ∪ PERSON_TABLES`; `orderBy id desc`; expediente/nombre/es_eventual/fecha_carga filters; pagination
- [ ] 1.4 `schemas/import.ts`: `tableListQuerySchema` + `tableListResponseSchema` (+`eventual_total`)
- [ ] 1.5 `importController.ts`: `listTableRows` (400 `INVALID_TABLE`, 500 `FETCH_ERROR`)
- [ ] 1.6 `server/src/routes/import.ts`: `GET /tables/:tableName` (authenticate)
- [ ] 1.7 Jest `TableQueryService.test.ts`: 120→3 pages; es_eventual filter; unknown table
- [ ] 1.8 supertest: 400 `INVALID_TABLE`; USER 200; schema shape

## Slice 2 — Write Paths (PR 2)

Done: R3 403, R4 tag/reset/`eventual_matched`, R5 create/409.

- [x] 2.1 `schemas/import.ts`: `importRequestSchema` + `nro_expediente`/`fecha_carga`; summary + `eventual_matched`; `createTableRowSchema` (minus id/version/imported_from/createdAt, + `fecha_carga`/`es_eventual`, Type2 `person_id`)
- [x] 2.2 `ImportExcelService.ts`: `importFile(..., opts)`; predicate (trim, case-insensitive); `_toRowData(row, ctx)`; counter
- [x] 2.3 `importController.ts`: `uploadFile` passes opts; `createTableRow` — Type1 409, Type2 400 `INVALID_PERSON`, `createVersionedRow(..., 'MANUAL')` + audit → 201
- [x] 2.4 `routes/import.ts`: `authorize('ADMIN')` on `POST /`; `POST /tables/:tableName/rows` (authenticate + ADMIN)
- [x] 2.5 supertest: USER 403 (no audit); Type1 409; Type2 201 + audit; `eventual_matched`; reset re-import

## Slice 3 — Client Contracts & API (PR 3)

Done: contracts mirror server `.strict()`; `tsc --noEmit` green.

- [ ] 3.1 `client/src/contracts/import.ts`: mirror whitelists; `TableRowContract` (+person_id), `TableListResponseContract`, `CreateRowResponseContract`, `eventual_matched`
- [ ] 3.2 Create `client/src/api/tables.ts`: `getTableRows`/`createTableRow` via `validateResponse`
- [ ] 3.3 Vitest `tables.test.ts`: URLs, contract parse, 409/403 mapping
- [ ] 3.4 Type gate: `cd client && npm run lint`

## Slice 4 — UI (PR 4)

Done: R2 views; R3 ADMIN button; R5 badge + create.

- [ ] 4.1 `ImportPage.tsx`: tabs Cargar / Ver tablas; pass `user.role`
- [ ] 4.2 Create `TableBrowser.tsx`: 14-table selector + ReportesHistorico
- [ ] 4.3 Create `DataTable.tsx`: columns config, filters, pagination, badge, `eventual_total`
- [ ] 4.4 Create `AddRowModal.tsx`: form; Type2 `person_id`; es_eventual toggle
- [ ] 4.5 Verify `npm run lint && npm test` + manual UI

## Dependencies

PR 1 → 4, child base = parent branch. Slice 2 needs migration columns; Slice 3 mirrors 1–2; Slice 4 consumes `api/tables.ts`.
