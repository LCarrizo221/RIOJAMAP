# Tasks: Excel Import with Multi-Table Tracking & Versioning

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,600 authored (schema, services, API, tests) |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 (5 stacked slices) |
| Delivery strategy | auto-chain |
| Chain strategy | **pending** — choose before sdd-apply starts |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

> **Action required**: Select your chain strategy before implementation begins.
> - **stacked-to-main** — each PR merges to `main` in order (fast, requires green CI per slice)
> - **feature-branch-chain** — `feature/excel-import` accumulates all slices; only tracker merges to `main` (safer rollback, coordinated release)
> - **size:exception** — single PR with maintainer approval (not recommended at ~1,600 lines)

---

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Prisma schema + migration + seed | PR 1 | `npx prisma migrate dev --name excel_import_tables` | `psql` inspect table list post-migration | Drop all 16 new tables; `git revert` schema.prisma + seed |
| 2 | Types + Zod schemas + NameNormalizationService | PR 2 | `npx vitest run src/services/import/NameNormalizationService.test.ts` | Pure function, no DB needed | Delete `types.ts`, `schemas/import.ts`, `NameNormalizationService.ts` |
| 3 | VersioningService + ReportesHistoricoService + MatchingService + ImportExcelService | PR 3 | `npx vitest run src/services/import/` | N/A — unit tests mock Prisma; no DB required | Delete `services/import/` directory |
| 4 | API routes + controller + client contracts + API client + npm deps | PR 4 | `curl -X POST http://localhost:3000/api/import` (expect 401 without token) | Local Express server with seeded DB | Remove `routes/import.ts`, `controllers/importController.ts`, `client/src/api/import.ts` |
| 5 | All unit + integration tests | PR 5 | `npx vitest run` | N/A — MSW mocks all HTTP | Delete test files (production code untouched) |

---

## Phase 1: Database Schema & Migration

- [x] **T1** — Add `Person` model to `server/prisma/schema.prisma` (8 lines; no FK deps; required before T2–T3)
  - **Files**: `server/prisma/schema.prisma`
  - **Dependencies**: none
  - **Est. lines**: ~10
  - **Test**: `npx prisma validate` passes; `Person` model listed in `npx prisma format` output

- [x] **T2** — Add 6 Type 1 models to `server/prisma/schema.prisma` (Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados); `expediente @unique`; version + imported_from + createdAt + updatedAt; `@@index` on expediente/version/createdAt
  - **Files**: `server/prisma/schema.prisma`
  - **Dependencies**: T1
  - **Est. lines**: ~95 (6 × ~16 lines)
  - **Test**: `npx prisma validate` passes; no FK errors

- [x] **T3** — Add 8 Type 2 models to `server/prisma/schema.prisma` (PiniHerrera, GabiPedrali, TeresitaMadera, FlorenciaLopez, GuryCaceres, Dirigentes, Romina, Misael); FK to `Person`; `@@unique([expediente, person_id, createdAt])`; same field set as Type 1 plus `person_id`
  - **Files**: `server/prisma/schema.prisma`
  - **Dependencies**: T1
  - **Est. lines**: ~155 (8 × ~19 lines)
  - **Test**: `npx prisma validate` passes; FK relationships resolve

- [x] **T4** — Add `ReportesHistorico` model to `server/prisma/schema.prisma`; all audit fields (matched_table_type, matched_table_name, matched_by_expediente, matched_by_name, version_created, warnings, import_source_file); 5 indexes
  - **Files**: `server/prisma/schema.prisma`
  - **Dependencies**: none (standalone log table)
  - **Est. lines**: ~25
  - **Test**: `npx prisma validate` passes; 5 `@@index` directives present

- [ ] **T5** — Run `npx prisma migrate dev --name excel_import_tables`; verify generated SQL DDL matches spec order: Person → Type 2 → Type 1 → ReportesHistorico → all indexes
  - **Files**: `server/prisma/migrations/YYYYMMDD_excel_import_tables/migration.sql` (auto-generated)
  - **Dependencies**: T1, T2, T3, T4
  - **Est. lines**: ~0 authored (SQL is generated); ~200 SQL lines to verify
  - **Test**: `psql` shows all 16 tables; FK constraints on person tables exist

- [x] **T6** — Create `server/prisma/seed-persons.ts`; insert 8 `Person` records with `name` and `table_name_alias` (pini_herrera → "Pablo Pini Herrera", gabi_pedrali → "Gabriela Pedrali", teresita_madera → "Teresita Madera", florencia_lopez → "Florencia Lopez", gury_caceres → "Gury Caceres", dirigentes → "Dirigentes", romina → "Romina", misael → "Misael"); wire into `package.json` seed script
  - **Files**: `server/prisma/seed-persons.ts`, `server/package.json` (add seed script)
  - **Dependencies**: T5
  - **Est. lines**: ~40
  - **Test**: `npx prisma db seed` exits 0; `prisma.person.count()` returns 8

---

## Phase 2: Types & Zod Schemas

- [x] **T7** — Create `server/src/schemas/import.ts`; define `BaseTableRowSchema` (DRY base); named aliases for 6 Type 1 schemas; `PersonTableRowSchema` (extends base + `person_id`); `PersonSchema`; `ReportesHistoricoSchema`; `ImportRequestSchema` (text fields only — multer handles binary); `MatchResultSchema`; `ImportSummarySchema`; `ImportResponseSchema`; export `ImportResponse` inferred type
  - **Files**: `server/src/schemas/import.ts`
  - **Dependencies**: none
  - **Est. lines**: ~130
  - **Test**: `import { ImportResponseSchema } from './import'` compiles without error; `ImportResponseSchema.parse({...})` validates a well-formed response object

- [x] **T8** — Create `server/src/services/import/types.ts`; export `ImportRow`, `MatchType` union, `TableType` union, `MatchResult`, `VersionedRowResult`, `ImportResult`, `ReportesHistoricoEntry` interfaces
  - **Files**: `server/src/services/import/types.ts`
  - **Dependencies**: none
  - **Est. lines**: ~65
  - **Test**: TypeScript compiles without errors; all interfaces importable from downstream services

---

## Phase 3: Core Services

- [x] **T9** — Create `server/src/services/import/NameNormalizationService.ts`; export `normalize(input: string): string` (toUpperCase → trim → collapse spaces → remove `,.-`) and `compare(a: string, b: string): boolean`; pure functions, no Prisma dependency; no class needed
  - **Files**: `server/src/services/import/NameNormalizationService.ts`
  - **Dependencies**: T8
  - **Est. lines**: ~40
  - **Test**: `normalize("Maza, Angel Eduardo") === "MAZA ANGEL EDUARDO"`; `compare("pini herrera", "PINI HERRERA") === true`

- [x] **T10** — Create `server/src/services/import/VersioningService.ts`; implement `getLatestVersion(tableName, expediente, prisma): Promise<{version: number} | null>`, `isDuplicate(tableName, expediente, importDate, prisma): Promise<boolean>`, `createVersionedRow(tableName, tableType, row, matchResult, importDate, prisma): Promise<VersionedRowResult>`; Type 1 = `prisma.upsert`; Type 2 = `prisma.create`
  - **Files**: `server/src/services/import/VersioningService.ts`
  - **Dependencies**: T7, T8, T5 (Prisma client with new models)
  - **Est. lines**: ~100
  - **Test**: Given mocked `prisma.expedientes.findFirst` returning `{version: 1}`, `getLatestVersion` returns `{version: 1}`; `isDuplicate` returns true when same date found

- [x] **T11** — Create `server/src/services/import/ReportesHistoricoService.ts`; implement `log(entry: ReportesHistoricoEntry, prisma): Promise<void>`; method MUST never throw (wrap in try/catch; log error to console but don't propagate); immutable insert only — no updates
  - **Files**: `server/src/services/import/ReportesHistoricoService.ts`
  - **Dependencies**: T7, T8, T5
  - **Est. lines**: ~55
  - **Test**: When `prisma.reportesHistorico.create` throws, `log()` resolves (does not reject); otherwise creates exactly 1 row

- [x] **T12** — Create `server/src/services/import/MatchingService.ts`; constructor receives `PrismaClient` and `persons: Person[]` (loaded at boot); implement `match(row: ImportRow): Promise<MatchResult>`; Type 1 loop sequential (ILIKE on `expediente`), detect multi-table ambiguity; Type 2 via `Promise.all` across 8 tables (normalize nombre before compare); return `expediente_exact | name_exact | ambiguous | no_match`
  - **Files**: `server/src/services/import/MatchingService.ts`
  - **Dependencies**: T8, T9, T11
  - **Est. lines**: ~115
  - **Test**: Given mocked prisma with `Expedientes` returning one row, `match({expediente: "EXP-001"})` returns `match_type: 'expediente_exact'`; given two tables returning the same expediente, returns `match_type: 'ambiguous'`

- [x] **T13** — Create `server/src/services/import/ImportExcelService.ts`; constructor receives `PrismaClient`, `MatchingService`, `VersioningService`, `ReportesHistoricoService`; implement `parseFile(buffer: Buffer): Promise<ImportRow[]>` using `exceljs` (first non-empty row = headers, case-insensitive map); implement `importFile(buffer, filename, importDate): Promise<ImportResult>`; chunk 100 rows per batch; per-row `try/catch`; call `ReportesHistoricoService.log()` for EVERY row regardless of match result
  - **Files**: `server/src/services/import/ImportExcelService.ts`
  - **Dependencies**: T7, T8, T9, T10, T11, T12
  - **Est. lines**: ~160
  - **Test**: `parseFile(buffer)` returns `ImportRow[]` matching headers in fixture `.xlsx`; `importFile` with mocked services returns `ImportResult` with correct `total_rows` count

---

## Phase 4: API Layer

- [x] **T14** — Install npm dependencies: `npm install multer exceljs express-rate-limit` and `npm install --save-dev @types/multer` in `server/`
  - **Files**: `server/package.json`, `server/package-lock.json`
  - **Dependencies**: none (can run in parallel with T7–T13)
  - **Est. lines**: ~0 authored
  - **Test**: `import multer from 'multer'` and `import ExcelJS from 'exceljs'` compile without errors

- [x] **T15** — Create `server/src/middleware/rateLimit.ts`; export `generalApiLimiter` via `express-rate-limit` (windowMs: 60 000, max: 20, standardHeaders: true)
  - **Files**: `server/src/middleware/rateLimit.ts`
  - **Dependencies**: T14
  - **Est. lines**: ~20
  - **Test**: `generalApiLimiter` is an Express middleware function; 21st request from same IP within 1 minute returns 429

- [x] **T16** — Create `server/src/controllers/importController.ts`; export `uploadFile`, `getExpedienteVersions`, `getPersonVersions`, `getReportesHistorico` handlers; thin: delegates to `ImportExcelService`; all 4xx/5xx return `{ error, code, details? }`; `uploadFile` reads `req.file.buffer` from multer; construct services at handler call time (load `Person` records via `prisma.person.findMany()` on first request, cache in module scope)
  - **Files**: `server/src/controllers/importController.ts`
  - **Dependencies**: T13, T7
  - **Est. lines**: ~110
  - **Test**: Mock `ImportExcelService.importFile` to return a valid `ImportResult`; call `uploadFile(req, res)`; assert `res.json` receives `{ success: true, summary: {...} }`

- [x] **T17** — Create `server/src/routes/import.ts`; configure `multer(memoryStorage, { fileFilter: .xlsx only, limits: { fileSize: 10 * 1024 * 1024 } })`; wire 4 routes: `POST /` → `multer → authenticate → generalApiLimiter → uploadFile`; `GET /expedientes/:numero/versions` → `authenticate → getExpedienteVersions`; `GET /person/:personId/table/:tableName/versions` → `authenticate → getPersonVersions`; `GET /reportes-historico` → `authenticate → getReportesHistorico`
  - **Files**: `server/src/routes/import.ts`
  - **Dependencies**: T15, T16
  - **Est. lines**: ~55
  - **Test**: `POST /api/import` without JWT cookie returns 401; with non-.xlsx file returns 400

- [x] **T18** — Register import router in `server/src/index.ts`; add `app.use('/api/import', importRouter)` after existing routes
  - **Files**: `server/src/index.ts`
  - **Dependencies**: T17
  - **Est. lines**: ~5
  - **Test**: `GET /api/import/expedientes/EXP-001/versions` returns 401 (route is registered and auth guard fires)

---

## Phase 5: Client Contracts & API Client

- [x] **T19** — Create `client/src/contracts/import.ts`; mirror server schemas with `.strict()` for drift detection (same pattern as `contracts/obra.ts`); export `ImportResponseContract`, `ReportesHistoricoContract`, `VersionHistoryContract`; re-export from `client/src/contracts/index.ts`
  - **Files**: `client/src/contracts/import.ts`, `client/src/contracts/index.ts`
  - **Dependencies**: T7 (mirrors server schemas; no runtime dep on server code)
  - **Est. lines**: ~65
  - **Test**: `ImportResponseContract.parse(mockValidResponse)` passes; `ImportResponseContract.strict().parse({...extraField})` throws `ZodError`

- [x] **T20** — Create `client/src/api/import.ts`; implement `postImport(file: File, importDate?: string): Promise<ImportResponse>`, `getVersionsByExpediente(numero: string)`, `getPersonVersions(personId: number, tableName: string)`, `getReportesHistorico(params)` using fetch API + `ImportResponseContract.parse()`; consistent with `api/obras.ts` pattern
  - **Files**: `client/src/api/import.ts`
  - **Dependencies**: T19
  - **Est. lines**: ~90
  - **Test**: Calling `postImport` with a File object builds `FormData` and calls `fetch('/api/import', { method: 'POST', body: formData })`

---

## Phase 6: Tests

- [ ] **T21** — Write unit tests for `NameNormalizationService`; cover all 5 normalization scenarios from spec; cover `compare()` true/false cases; cover null/empty input guards; use Vitest
  - **Files**: `server/src/services/import/NameNormalizationService.test.ts`
  - **Dependencies**: T9
  - **Est. lines**: ~60
  - **Test (RED)**: Assert `normalize("Maza - Angel - Eduardo") === "MAZA ANGEL EDUARDO"` before writing implementation; assert `normalize(null as any) === ""`

- [ ] **T22** — Write unit tests for `MatchingService`; mock `PrismaClient` via `vi.mock`; cover `expediente_exact`, `name_exact`, `ambiguous` (multi-table), `no_match` branches; cover Type 2 parallel `Promise.all` path; cover name normalization in name-match path
  - **Files**: `server/src/services/import/MatchingService.test.ts`
  - **Dependencies**: T12
  - **Est. lines**: ~120
  - **Test (RED)**: Assert ambiguous case when two Type 1 tables both return a row for the same expediente → `match_type === 'ambiguous'`

- [ ] **T23** — Write unit tests for `VersioningService`; mock `PrismaClient`; cover `isDuplicate` same-day (true) vs next-day (false); cover Type 1 `upsert` path (`version++`); cover Type 2 `create` path (new row, no upsert); cover `getLatestVersion` null case (first import)
  - **Files**: `server/src/services/import/VersioningService.test.ts`
  - **Dependencies**: T10
  - **Est. lines**: ~95
  - **Test (RED)**: Assert `isDuplicate` returns `true` when `prisma[table].findFirst` returns a row on the same calendar day

- [ ] **T24** — Write Vitest + MSW integration tests for `client/src/api/import.ts`; add MSW handler for `POST /api/import` returning `ImportResponse` fixture; assert `postImport()` resolves with parsed contract; add handler for GET version endpoints; assert contract `.parse()` catches unexpected server fields; test 401 returns rejected promise
  - **Files**: `client/src/api/import.test.ts`, `client/src/mocks/handlers.ts` (add import handlers), `client/src/mocks/fixtures.ts` (add ImportResponse fixture)
  - **Dependencies**: T20, T19
  - **Est. lines**: ~120
  - **Test (RED)**: Assert `postImport()` with mocked 401 response throws; assert `ImportResponseContract.strict().parse({...extraField})` throws before writing the contract

---

## Dependency Graph

```
T1 ──┬─── T2 ──────────────────────────────────────────────────────────┐
     └─── T3 ──────────────────────────────────────────────────────────┤
T4 ──────────────────────────────────────────────────────────────────► T5 ──► T6
                                                                        │
T7 (parallel, no dep) ──────────────────────────────────────────────► T16
T8 (parallel, no dep) ──┬─── T9 ──► T12 (also needs T8, T11) ──────► T13 ──► T16
                         ├─── T10 ─────────────────────────────────► T13
                         └─── T11 ──────────────────────────────────► T13
                                                                        │
T14 (parallel, no code dep) ──► T15 ──► T17 ──► T18 (register routes)  │
                                                                        │
T19 (parallel, no server dep) ──► T20                                  │
                                                                        ▼
T21 ──► T9                                                          sdd-verify
T22 ──► T12
T23 ──► T10
T24 ──► T20, T19
```

**Can run in parallel within a PR slice:**
- T1, T4, T7, T8, T14 — no interdependencies
- T2, T3 — both depend on T1; can be done in one commit
- T9, T10, T11 — all depend only on T8; parallelizable
- T21, T22, T23, T24 — each tests its own service independently

**Strictly sequential:**
- T1 → T2+T3 → T5 → T6 (schema must be complete before migration)
- T12 → T13 (MatchingService must exist before ImportExcelService)
- T13 → T16 (ImportExcelService before controller)
- T17 → T18 (routes before registration)

---

## Summary

| Phase | Tasks | Estimated Lines | Focus |
|-------|-------|-----------------|-------|
| Phase 1 — Schema | T1–T6 | ~310 authored | Prisma models, migration, seed |
| Phase 2 — Types/Schemas | T7–T8 | ~195 | Zod contracts + TS interfaces |
| Phase 3 — Services | T9–T13 | ~470 | Business logic layer |
| Phase 4 — API | T14–T18 | ~190 | Express routes + controller |
| Phase 5 — Client | T19–T20 | ~155 | Client contracts + fetch wrappers |
| Phase 6 — Tests | T21–T24 | ~395 | Unit + integration tests |
| **Total** | **24** | **~1,715** | |

**Next step**: Select chain strategy (stacked-to-main / feature-branch-chain / size:exception), then proceed with `sdd-apply` for Unit 1 (T1–T6).
