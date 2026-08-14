```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:4449ff46993910123814219eff8e7c7a9b4e7c0345deb2e419cc896c10728f86
verdict: pass
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 13/13
test_command: cd server && npm.cmd test (jest); cd client && npm.cmd test (vitest)
test_exit_code: 0
test_output_hash: sha256:fb9c4a2500dd2063d2ff5369b73f469bafdb4c4da40ea149063d3643715b0f77
build_command: cd server && npm.cmd run lint && npx.cmd tsc --noEmit; cd client && npm.cmd run lint && npx.cmd tsc --noEmit
build_exit_code: 0
build_output_hash: sha256:4a3d96bd183ff1650a74cc9cc9e0384630163addd4bad0c522a64e80ca968a82
```
## Verification Report

**Change**: 2026-08-14-vistas-tablas-y-cargas (Data Table Views, Manual Row Entry & Eventual Movements)
**Version**: N/A — delta specs (5 capabilities: data-table-views, eventual-movements, import-permissions, load-date-tracking, manual-row-entry)
**Mode**: Standard (strict_tdd: false — strict-tdd-verify.md NOT loaded)
**Evidence**: HEAD 18e2c7c (`feature/vistas-tablas-y-cargas-pr-1`), re-run after coverage fix — the previous FAIL (evidence_revision sha256:8d8a6227…) flagged 2 CRITICAL UNTESTED + 1 WARNING PARTIAL; all three closed by commit 18e2c7c.

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 23 |
| Tasks complete | 23 |
| Tasks incomplete | 0 |

### Build & Tests Execution

All six declared gates executed on the clean working tree (branch `feature/vistas-tablas-y-cargas-pr-1`, HEAD 18e2c7c). Note: `npm`/`npx` resolve to a broken `npm.ps1` shim in this Node install (`Unknown command: "pm"`), so the `.cmd` shims were invoked explicitly; the scripts behind them are the declared ones (`tsc --noEmit`, `jest`, `vitest run`).

| # | Command | Exit | Output hash (sha256 of exact captured bytes) |
|---|---------|------|-----------------------------------------------|
| 1 | `server: npm.cmd run lint` (tsc --noEmit) | 0 | `a722edf921ed60ef8f81248938bf312ea89e941a73ae1b07876a3bda7cae9a37` |
| 2 | `server: npx.cmd tsc --noEmit` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) |
| 3 | `server: npm.cmd test` (jest) | 0 | `5cf6b3426b628bef8ca6b9fa3c8a9822a34b070e32912d3aae630759e21b8d53` |
| 4 | `client: npm.cmd run lint` (tsc --noEmit) | 0 | `83ca01367c1d68610f7cc9f1a217e8bfb7b405fb126b2c94090f2c4999b525e0` |
| 5 | `client: npx.cmd tsc --noEmit` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) |
| 6 | `client: npm.cmd test` (vitest) | 0 | `4ba19c7e73099b3d044f4dcdfb107744d085c88fdc110d41eea380f17285abd1` |

**Build**: ✅ Passed — server + client `tsc --noEmit` clean (also via `npm.cmd run lint`).
**Tests**: ✅ Server jest `Test Suites: 11 passed, 11 total — Tests: 69 passed, 69 total` (14.1s). ✅ Client vitest `Test Files 5 passed (5) — Tests 41 passed (41)` (8.9s). Zero failures, zero skipped. Suite/tests grew from the previous run (10 suites / 50 tests) via commit 18e2c7c (+1 suite `tests/migrations/load-date-eventual-migration.test.ts`, +19 tests).
**Coverage**: ➖ Not available — no coverage thresholds configured in this project (jest/vitest run without coverage collection).

Combined evidence digests (exact byte concatenation in declaration order):
- `test_output_hash` = sha256(server-jest.txt || client-vitest.txt) = `fb9c4a2500dd2063d2ff5369b73f469bafdb4c4da40ea149063d3643715b0f77`
- `build_output_hash` = sha256(server-lint.txt || client-lint.txt || server-tsc.txt || client-tsc.txt) = `4a3d96bd183ff1650a74cc9cc9e0384630163addd4bad0c522a64e80ca968a82`

### Spec Compliance Matrix

| Requirement | Scenario | Test (runtime evidence) | Result |
|-------------|----------|-------------------------|--------|
| data-table-views | Paginate a valid table | `server/tests/import/TableQueryService.test.ts > paginates 120 rows into 3 pages ordered by id desc` (page 2, limit 50, total 120, totalPages 3, 50 rows) | ✅ COMPLIANT |
| data-table-views | Filter eventual rows | `server/tests/import/TableQueryService.test.ts > filters es_eventual=true rows` (piniHerrera) | ✅ COMPLIANT |
| data-table-views | Reject unknown table | `server/tests/import/TableQueryService.test.ts > rejects an unknown table with InvalidTableError` + `server/tests/api/importRoutes.test.ts > rejects an unknown table with 400 INVALID_TABLE` (supertest, "hackers") | ✅ COMPLIANT |
| eventual-movements | Type1 row tagged on the upserted row | `server/tests/import/ImportExcelService.test.ts > tags rows matching nro_expediente es_eventual=true and counts eventual_matched` (upsert path, es_eventual=true, fecha_carga=importDate, eventual_matched=1, upsert×2 → no second row created) | ✅ COMPLIANT |
| eventual-movements | Normal re-import resets the flag | `server/tests/import/ImportExcelService.test.ts > normal import (no nro_expediente) persists es_eventual=false and omits eventual_matched` | ✅ COMPLIANT |
| eventual-movements | Type2 row tagged eventual | `server/tests/import/ImportExcelService.test.ts > tags a Type2 row matched by name es_eventual=true and spreads it into the versioned insert` (name_exact branch, createVersionedRow rowData `es_eventual: true`, `person_id: 3`) + `> tags a Type2 row matched by expediente es_eventual=true and spreads it into the versioned insert` (expediente_exact branch) — added by commit 18e2c7c | ✅ COMPLIANT |
| import-permissions | USER blocked from loading | `server/tests/api/importRoutes.test.ts > USER blocked from POST /api/import with 403 FORBIDDEN and no DB access` (asserts no PrismaClient instantiation → nothing persisted/audited) | ✅ COMPLIANT |
| import-permissions | USER reads table lists | `server/tests/api/importRoutes.test.ts > lets USER read rows and matches the spec response shape` (USER 200, schema parse, eventual_total) | ✅ COMPLIANT |
| load-date-tracking | Existing rows keep null load date | `server/tests/migrations/load-date-eventual-migration.test.ts` (NEW, commit 18e2c7c): `adds the two columns to exactly the 14 expected tables` + `it.each` over all 14 tables asserting `"fecha_carga" TIMESTAMP(3)` nullable (no NOT NULL, no DEFAULT) and `"es_eventual" BOOLEAN NOT NULL DEFAULT false` + `does not backfill fecha_carga or es_eventual (existing rows keep NULL)` (no UPDATE statements) | ✅ COMPLIANT |
| load-date-tracking | Absent fecha_carga uses effective import date | `server/tests/import/ImportExcelService.test.ts > tags rows matching nro_expediente…` asserts `rowData.fecha_carga === importDate` with no `opts.fecha_carga` (controller: `importDate = body.import_date ?? new Date()`; service: `effectiveFechaCarga = opts.fecha_carga ?? importDate`) | ✅ COMPLIANT |
| manual-row-entry | Create Type2 row manually | `server/tests/api/importRoutes.test.ts > Type2 manual create returns 201 with created row and writes an audit entry` (version 1, imported_from MANUAL, es_eventual false, fecha_carga present, `reportesHistorico.create` called) | ✅ COMPLIANT |
| manual-row-entry | Type1 manual create conflicts | `server/tests/api/importRoutes.test.ts > Type1 manual create with existing expediente returns 409 EXPEDIENTE_EXISTS` | ✅ COMPLIANT |
| manual-row-entry | Manual eventual row | Persist: `server/tests/api/importRoutes.test.ts > Type2 manual eventual create persists es_eventual=true and fecha_carga` (NEW, commit 18e2c7c — 201, body es_eventual=true, audit written). Badge: `client/src/components/__tests__/import-views.test.tsx > renders the EVENTUAL badge for eventual rows`. Filter: `server/tests/import/TableQueryService.test.ts > filters es_eventual=true rows` + client wiring `client/src/components/DataTable.tsx` ("Solo eventuales" toggle → `es_eventual: 'true'`) | ✅ COMPLIANT |

**Compliance summary**: 13/13 scenarios compliant (previous run: 10/13 — the 2 UNTESTED and 1 PARTIAL are closed by commit 18e2c7c).

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Data Table List Views | ✅ Implemented | `GET /api/import/tables/:tableName`: whitelist `GENERIC_TABLES ∪ PERSON_TABLES` (400 `INVALID_TABLE`), filters expediente/nombre (insensitive) + es_eventual + fecha_carga (ISO day → [startOfDay, endOfDay]), orderBy id desc, page/limit (max 100), `eventual_total` via `countEventual`; reportes-historico reuses existing endpoint (UI tab, read-only). |
| Eventual Import Mode | ✅ Implemented | `importFile(buffer, importDate, file, opts?)`; predicate `expediente.trim().toLowerCase() === nro_expediente.trim().toLowerCase()`; `eventual_matched` counter only when row persisted; Type1 upsert update-branch carries `es_eventual`/`fecha_carga`; Type2 create spreads `_toRowData(row, ctx)`; audit unchanged. |
| Role-Based Import Permissions | ✅ Implemented | `authorize('ADMIN')` on `POST /api/import` and `POST /api/import/tables/:tableName/rows` (before multer/controller — no DB access on denial); `GET /tables/:tableName` behind `authenticate` only (ADMIN + USER); 403 `FORBIDDEN` shape standard. |
| Load-Date & Eventual Persistence | ✅ Implemented | Migration adds `fecha_carga DateTime?` + `es_eventual Boolean @default(false)` to all 14 models; Type2 `@@index([es_eventual])`/`@@index([fecha_carga])`; effective date = `opts.fecha_carga ?? importDate`, `importDate = body.import_date ?? new Date()` (spec decision #3 — current date/time, not midnight). |
| Manual Row Creation | ✅ Implemented | `POST /tables/:tableName/rows`: whitelist → Type1 `findUnique` pre-check → 409 `EXPEDIENTE_EXISTS`; Type2 `person_id` required + exists → 400 `INVALID_PERSON`; `createVersionedRow(..., 'MANUAL')` with `fecha_carga` (default `new Date()`) + `es_eventual` (default false); audit via `historicoService.log`; 201 with created row. |

### Coherence (Design)

| Design decision | Followed? | Notes |
|-----------------|-----------|-------|
| 1. List pagination `orderBy: { id: 'desc' }` | ✅ Yes | `TableQueryService.list` — orderBy id desc, PK index. |
| 2. Type2-only filter indexes | ✅ Yes | Migration creates `es_eventual`/`fecha_carga` indexes on the 8 Type2 tables only. |
| 3. New `TableQueryService` (list, countEventual) | ✅ Yes | New service; thin controller composes response envelope. |
| 4. Whitelist dispatch → 400 `INVALID_TABLE` | ✅ Yes | `InvalidTableError` mapped in controller; supertest RED-covered. |
| 5. `authorize('ADMIN')` on both POSTs (existing middleware) | ✅ Yes | Zero new auth code; 403 standard. |
| 6. Type1 manual create: 409 pre-check + `createVersionedRow` v1 `imported_from='MANUAL'` | ✅ Yes | No `upsertGenericRow` on manual path — editing stays out of scope. |
| 7. Eventual plumbing via `_toRowData(row, ctx)` | ✅ Yes | ctx `{fecha_carga, es_eventual}` threaded through tagged and matched paths. |
| 8. `eventual_total` computed in list response | ✅ Yes | Single round-trip `Promise.all([list, countEventual])`. |
| Effective `fecha_carga = opts.fecha_carga ?? importDate` | ✅ Yes | ImportExcelService line 333; controller `importDate = body.import_date ?? new Date()`. |
| Manual rows: `fecha_carga` default current date; `es_eventual` optional | ✅ Yes | Controller `fechaCarga = body.fecha_carga ?? new Date()`; `es_eventual: body.es_eventual ?? false`. |
| Client contracts mirror server `.strict()` + eventual fields | ✅ Yes | `contracts/import.ts` mirrors schemas with `.strict()`; `eventual_matched` optional; whitelist constants mirrored. |
| UI: 15 tabs (14 tables + ReportesHistorico read-only), badge, filters, "+ Agregar fila" (ADMIN) | ✅ Yes | `ALL_IMPORT_TABLES` = 14 + reportes-historico; `readonly` hides add/filters; EVENTUAL badge; role-gated button (component tests). |

### Issues Found

**CRITICAL**: None — the previous FAIL's 2 CRITICAL UNTESTED scenarios (eventual-movements "Type2 row tagged eventual", load-date-tracking "Existing rows keep null load date") are now covered by passing runtime tests added in commit 18e2c7c.

**WARNING**: None — the previous WARNING PARTIAL (manual-row-entry "Manual eventual row" server persistence) is now covered by the passing supertest `Type2 manual eventual create persists es_eventual=true and fecha_carga`.

**SUGGESTION**:
1. Minor: client `TableListQueryContract` is defined but `getTableRows` builds query params manually; harmless duplication, could be unified.
2. Minor: the eventual counter increments only when the row is actually persisted (`versionResult !== null`) — matches the spec wording "persisted with es_eventual=true"; consider documenting this semantic explicitly.
(Previous SUGGESTION #1 — add the missing covering tests — is resolved by commit 18e2c7c.)

### Verdict

PASS — All six command gates pass (jest 11 suites / 69 tests, vitest 5 files / 41 tests, tsc --noEmit clean in both packages), all 13/13 spec scenarios have passing runtime covering tests (the 2 previously UNTESTED and 1 PARTIAL closed by commit 18e2c7c), the implementation is statically correct against proposal, all 5 specs, design (8/8 decisions) and 23/23 tasks are complete. No CRITICAL, no WARNING, no blockers, no command failures; only 2 minor SUGGESTIONs remain. Change is archive-ready.
