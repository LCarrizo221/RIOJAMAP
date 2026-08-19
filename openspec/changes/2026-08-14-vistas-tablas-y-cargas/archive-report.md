# Archive Report: 2026-08-14-vistas-tablas-y-cargas

**Change**: Data Table Views, Manual Row Entry & Eventual Movements
**Archived**: 2026-08-14 | **Mode**: hybrid (OpenSpec + Engram) | **Branch**: feature/vistas-tablas-y-cargas-pr-1 | **HEAD**: 18e2c7c

## Change Overview

Paginated read-only views for the 14 data tables + ReportesHistorico inside ImportPage (tabs: Cargar / Ver tablas). ADMIN loads (Excel, both modes, + manual rows); USER reads only. `fecha_carga` and `es_eventual` persisted via Prisma migration `load_date_eventual`; import pipeline extended, not rewritten.

Delivered capabilities (5 delta specs, now main specs under `openspec/specs/`):
- `data-table-views` — `GET /api/import/tables/:tableName`, paginated, filters (expediente, nombre, fecha_carga, es_eventual, page, limit), whitelist `GENERIC_TABLES ∪ PERSON_TABLES` → 400 `INVALID_TABLE`
- `eventual-movements` — `POST /api/import` optional `nro_expediente`/`fecha_carga`; matching rows persist `es_eventual=true`; summary `eventual_matched`
- `import-permissions` — `authorize('ADMIN')` on both POSTs; USER 403 `FORBIDDEN` with no persistence/audit; reads open to ADMIN+USER
- `load-date-tracking` — `fecha_carga DateTime?` + `es_eventual Boolean @default(false)` on all 14 models via Prisma migration; Type2 `@@index([es_eventual])`/`@@index([fecha_carga])`; no backfill (existing rows keep NULL/false)
- `manual-row-entry` — `POST /api/import/tables/:tableName/rows` (ADMIN): Type1 409 pre-check on existing expediente, Type2 requires valid `person_id` (400 `INVALID_PERSON`); VersioningService `createVersionedRow('MANUAL')` + ReportesHistorico audit → 201

## Final-State Facts (authority: native review + persisted tasks + orchestrator launch prompt)

- Commit `18e2c7c` (branch `feature/vistas-tablas-y-cargas-pr-1`) closed all verification gaps from the earlier FAIL run (evidence_revision sha256:8d8a6227…, 2 CRITICAL UNTESTED + 1 WARNING PARTIAL): +19 tests across 3 files — NEW `server/tests/migrations/load-date-eventual-migration.test.ts` (16 tests: migration adds the two columns to exactly the 14 tables, nullable `TIMESTAMP(3)` fecha_carga, `BOOLEAN NOT NULL DEFAULT false` es_eventual, no backfill); `server/tests/import/ImportExcelService.test.ts` +2 Type2 eventual tagging branches (name_exact, expediente_exact); `server/tests/api/importRoutes.test.ts` +1 manual eventual row (Type2, es_eventual=true, audit written).
- Final test state: server jest 11 suites / 69 tests pass; client vitest 5 files / 41 tests pass; lint (`tsc --noEmit`) clean in both packages.
- Verification re-run: `gentle-ai sdd-verify-validate --input <verify-report.md> --requirements 5 --scenarios 13` → `{"valid": true, "verdict": "pass"}`. verify-report.md evidence_revision sha256:4449ff46993910123814219eff8e7c7a9b4e7c0345deb2e419cc896c10728f86.
- Ledger: sdd-attempt ordinal 8 (verify-rerun-20260814-01) outcome `passed`, next_action `complete`, complete true.

## Verification (PASS)

- Requirements: 5/5 | Scenarios: 13/13 | Blockers: 0 | CRITICAL findings: 0
- test_output_hash: sha256:fb9c4a2500dd2063d2ff5369b73f469bafdb4c4da40ea149063d3643715b0f77
- build_output_hash: sha256:4a3d96bd183ff1650a74cc9cc9e0384630163addd4bad0c522a64e80ca968a82
- Commands: server `npm.cmd test` (jest, exit 0); client `npm.cmd test` (vitest, exit 0); lint + `tsc --noEmit` both packages (exit 0). All six gates green.
- Note: build_output_hash concatenation-order mismatch between verify-report.md:49 and the re-run report (doc-level, deterministic, SUGGESTION — see follow-ups; does not affect the pass verdict or evidence revision).

## Review Status (gate: allow)

- Lineage `review-verify-coverage-fix` (successor, scope-changed) — approved, covering the implementation candidate; post-apply gate `allow`.
- Fresh lineage `review-73e92a70ee644372` (1 path: verify-report.md PASS) — approved; post-apply gate `allow`.
- No BLOCKER / CRITICAL anywhere in review history. Remaining findings are info-level follow-ups (below).

## Task Completion (23/23)

`openspec/changes/2026-08-14-vistas-tablas-y-cargas/tasks.md` — all 23 implementation tasks checked `[x]` (Slice 1: 8, Slice 2: 5, Slice 3: 5, Slice 4: 5). Task Completion Gate passed. No stale unchecked tasks; no archive-time reconciliation needed. Note: `apply-progress.md` was never persisted for this change; the orchestrator's final-state facts (above) carry authority per the Final-State Authority hierarchy.

## Specs Synced (delta → main)

| Domain | Action | Main spec |
|--------|--------|-----------|
| data-table-views | Created (delta = full spec) | openspec/specs/data-table-views/spec.md |
| eventual-movements | Created (delta = full spec) | openspec/specs/eventual-movements/spec.md |
| import-permissions | Created (delta = full spec) | openspec/specs/import-permissions/spec.md |
| load-date-tracking | Created (delta = full spec) | openspec/specs/load-date-tracking/spec.md |
| manual-row-entry | Created (delta = full spec) | openspec/specs/manual-row-entry/spec.md |

No prior main specs existed for these domains → copied directly, normalized to repo convention (no frontmatter, `## Requirements` heading; requirement bodies, scenarios, and Decisions tables preserved verbatim). No REMOVED/MODIFIED/RENAMED deltas. No `openspec/CHANGELOG.md` exists and the skill prescribes none → no index update performed.

## Known Follow-Ups (info-level, NON-blocking — do not block archive)

1. **Timezone handling of `fecha_carga`** — `server/src/services/import/TableQueryService.ts:113` assumes local/UTC; La Rioja is UTC-3. Day-range filter could shift for users outside server TZ.
2. **Eventual import mode not reachable from UI** — `client/src/components/ImportPage.tsx:51`; `nro_expediente`/`fecha_carga` currently API-only.
3. **PrismaClient `$disconnect` leak on error paths** — `server/src/controllers/importController.ts:250`.
4. **Check-then-insert race** — Type1 409 pre-check (`findUnique`) vs concurrent create could surface 500 instead of 409 — `server/src/controllers/importController.ts:305`.
5. **Remaining HTTP status gap suggestions** — `server/tests/api/importRoutes.test.ts:178`.
6. **No indexes on Type1 `es_eventual`/`fecha_carga`** — migration indexes Type2 only (`server/prisma/migrations/20260814142505_load_date_eventual/migration.sql:57`); deliberate per design decision #2 (Type1 = one row per unique expediente), revisit if Type1 grows.
7. **build_output_hash concatenation order mismatch** — `verify-report.md:49` vs re-run; doc-level, deterministic, SUGGESTION only.

## Archive Decision

**Archived with no caveats** — intentional full archive, not partial. All gates green: verification PASS (13/13, 5/5), 0 CRITICAL, 0 blockers, tasks 23/23 complete, review gate `allow`. Follow-ups above are info-level and recorded for future changes; none block closure.

Per orchestrator scope for this run: delta specs synced into `openspec/specs/`, archive report persisted to OpenSpec (this file) + Engram topic `sdd/2026-08-14-vistas-tablas-y-cargas/archive-report`. Physical change-folder move to `openspec/changes/archive/2026-08-14-vistas-tablas-y-cargas/` is deferred to the delivery step (per orchestrator scope — no git operations in this run; next step is PR creation).

## Traceability

- OpenSpec artifacts: `openspec/changes/2026-08-14-vistas-tablas-y-cargas/{proposal.md, design.md, tasks.md, verify-report.md, specs/{data-table-views,eventual-movements,import-permissions,load-date-tracking,manual-row-entry}/spec.md}`
- Synced main specs: `openspec/specs/{data-table-views,eventual-movements,import-permissions,load-date-tracking,manual-row-entry}/spec.md`
- Engram: topic `sdd/2026-08-14-vistas-tablas-y-cargas/archive-report` — observation id 156 (sync obs-9d893374b2bed00b)
