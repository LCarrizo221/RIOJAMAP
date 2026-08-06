# Proposal: Excel Import with Multi-Table Tracking & Historic Versioning

## Intent

RIOJAMAP manages government assistance programs through Excel files organized into two table types:
1. **Generic Tables** (Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados) - track programs and agreements
2. **Person Tables** (PiniHerrera, GabiPedrali, TeresitaMadera, FlorenciaLopez, GuryCaceres, Dirigentes, Romina, Misael, etc.) - track individual person movements

This change introduces **automated daily import (INFORME DIARIO)** with **intelligent matching against both table types** (expediente number + name/apellido), **versioned updates** (non-destructive, maintains full audit trail), and **historic tracking** of all imported transactions. Each table is updated with new data while maintaining version history—enabling the RIOJAMAP admin team to upload daily payment reports, reconcile amounts, track changes over time, and maintain complete traceability.

## Scope

### In Scope
- **Generic Tables** schema (Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados) - importable, updatable, versioned
- **Person Tables** schema (PiniHerrera, GabiPedrali, etc.) with 1:N relationship to `Person` model
- **ReportesHistorico** table (audit trail: same format as INFORME DIARIO + fecha_importacion)
- Daily report parsing (INFORME DIARIO Excel format)
- Dual-criteria matching: Expediente number (exact, case-insensitive) + Name/Apellido (normalized)
- **Versioned updates** (no overwrite): Create new row with tracking metadata (version, updated_at, change_summary) when data changes
- Import service that:
  - Parses Excel rows (fecha, expediente, nombre, monto, etc.)
  - Searches BOTH generic tables AND person tables for matches
  - Creates new versioned rows in matched table (preserving full history)
  - Saves every import to ReportesHistorico with fecha_importacion
- Backend import service and supporting utility functions (no UI in this slice)

### Out of Scope
- Import UI/dashboard (scheduled for separate change)
- Audit trail reporting/visualization dashboard
- Automatic amount reconciliation or balance calculation
- Bulk historical import from master file (entire sheets at once)
- Person onboarding workflow or directory management UI
- Conflict resolution UI for ambiguous matches
- Support for other file formats (CSV, JSON) — Excel only initially
- Real-time sync with Excel files

## Capabilities

### New Capabilities

- `excel-import-service`: Parse daily report Excel files, apply dual-criteria matching logic, create versioned records in matched tables, log to ReportesHistorico
- `generic-table-storage`: Store Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados with versioning (id, data, version, updated_at, created_at)
- `person-table-storage`: Store person-specific tables (PiniHerrera, etc.) with 1:N relationship to Person model and versioning support
- `name-normalization`: Normalize person names for matching ("MAZA ANGEL EDUARDO" = "Maza, Angel Eduardo" = "Maza Angel Eduardo")
- `expediente-matching`: Exact, case-insensitive matching against Expediente numbers in all generic tables and person tables
- `historic-tracking`: ReportesHistorico table records all imports with fecha, expediente, nombre, monto, and source import metadata
- `versioned-updates`: Create new rows with version tracking instead of overwriting; maintain full change history per table per record

### Modified Capabilities

- `obra-crud`: No changes (Obra table remains independent from new import system)

## Approach

**Database Design**: 
- **Generic Tables**: Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados with versioning columns (version, updated_at, created_at, imported_from)
- **Person Tables**: PiniHerrera, GabiPedrali, etc. - each table has 1:N relationship to `Person` model; versioning enabled
- **ReportesHistorico**: Immutable log of every import transaction (fecha_importacion, source file, data snapshot)
- **Person Model**: Stores person metadata (name, table_name_alias, etc.) - links to person-specific tables via 1:N

**Matching Algorithm**:
1. Extract expediente, name/apellido, monto, fecha from Excel row
2. Search BOTH generic tables AND person tables:
   - Priority A: Exact, case-insensitive expediente match (in any table type)
   - Priority B: Normalized name match (in Person tables)
3. If match found → Create new versioned row in that table (version++, updated_at=import_date, import_source=INFORME_DIARIO)
4. If NO match → Log warning; optionally skip or flag for manual review
5. ALWAYS → Save row to ReportesHistorico with fecha_importacion (creates permanent audit record)

**Import Service**: Express endpoint `/api/import` accepts Excel file. Service:
- Parses each row
- Applies matching logic against all 6 generic tables + all person tables
- Creates new versioned records (not overwrites)
- Logs to ReportesHistorico
- Returns import summary (matched by expediente, matched by name, unmatched, warnings)

**Data Validation**: Zod schemas for all import data. Handle nulls gracefully (missing fecha → use import date; missing monto → 0).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/prisma/schema.prisma` | New | Add Person, Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados, ReportesHistorico, PiniHerrera, GabiPedrali, TeresitaMadera, FlorenciaLopez, GuryCaceres, Dirigentes, Romina, Misael models with versioning (version, updated_at, created_at, imported_from columns). Foreign key relationships from person tables to Person. |
| `server/src/services/import/` | New | ImportExcelService, MatchingService (searches both generic + person tables), NameNormalizationService, VersioningService (creates new versioned rows instead of overwrites) |
| `server/src/routes/import.ts` | New | POST /api/import, GET /api/import-logs, GET /api/expedientes/:numero/versions, GET /api/person/:personId/table/:tableName/versions |
| `server/src/schemas/import.ts` | New | Zod schemas for all table types (Expedientes, ConveniosMunic, Person table rows, ReportesHistorico) validation |
| `server/prisma/migrations/` | New | Migration to create all new tables with versioning columns and indexes on expediente, person_id, fecha, version |
| Database indexes | New | Indexes on (expediente), (person_id), (fecha), (version) for fast lookup during matching and versioning queries |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Name matching produces false positives (e.g., "Herrera" matches 2+ different people) | High | Implement normalized string matching with threshold; flag ambiguous matches (>1 result) for manual review. Log flagged rows in ReportesHistorico for audit. Prefer expediente match over name when both available. |
| Matching across 14+ tables (6 generic + 8+ person) creates overlaps or conflicts (same expediente in multiple tables) | Medium | Design matching logic with priority order: search generic tables first, then person tables. If found in multiple places, flag and log conflict in ReportesHistorico. Allow admin to manually resolve. |
| Versioning creates row explosion (100 imports/day × 50 rows = 5000 new rows/day in one table) | Medium | Implement soft delete or archive strategy. Move old versions >30 days to archive table. Monitor table growth; add pagination to version history queries. |
| Excel parsing fails on merged cells or non-standard headers (daily report format may vary) | Medium | Test with actual INFORME DIARIO file during design phase. Document header row expectations. Fall back to manual column mapping if headers are ambiguous. |
| Duplicate re-imports create duplicate versioned rows (same date, expediente, person) | Medium | At import time, check if (expediente, fecha, person_id) tuple exists in target table at same version. If yes, skip or flag for review; log in ReportesHistorico. |
| Null valores in fecha or monto cause import to abort | Low | Handle gracefully: use import_date if fecha is null; treat monto as 0 if null. Log assumption in ReportesHistorico. |
| Scalability: large daily reports (500+ rows) matching against 14 tables slow down matching | Low | Implement batch processing with transaction-per-100-rows. Use database indexes (expediente, person_id, fecha) for O(log n) lookups. Monitor query times. |
| Person table schema mismatch (different columns per person table) causes import errors | Medium | Standardize all person table schemas: same columns (expediente, nombre, monto_total, monto_parcial, saldo, fecha_actualizacion, version, etc.). Validate column mapping before import starts. |

## Rollback Plan

1. **Data Rollback**: Delete all rows from Person, Movement, Expediente, ImportLog tables created after rollback date. Restore from backup if needed.
2. **Schema Rollback**: Run `prisma migrate resolve --rolled-back <migration-name>` and `git revert` the schema.prisma changes.
3. **API Rollback**: Remove `/api/import*` routes and import service code. Existing Obra table remains untouched.
4. **Validation**: Confirm Obra endpoints still work (they are independent from Movement tables). Re-test manual API input.

## Dependencies

- **Prisma 5.22.0+** (already in use; ORM layer)
- **PostgreSQL 14** (already in use; DBMS)
- **xlsx or exceljs npm package** (to be added for Excel parsing)
- **string-similarity or fuzzyset.js** (to be added for fuzzy name matching)
- **Zod 3.x** (already in use; validation)

## Success Criteria

- [ ] Prisma schema migration applied; all 14 models created (6 generic tables + 8+ person tables + Person model + ReportesHistorico) with versioning columns and correct indexes
- [ ] All person table schemas standardized: (id, expediente, nombre, monto_total, monto_parcial, saldo, version, created_at, updated_at, imported_from)
- [ ] ImportExcelService parses daily report Excel correctly (tested against real INFORME DIARIO file)
- [ ] Matching algorithm searches BOTH generic tables AND person tables; matches 90%+ of rows by expediente or name without false positives
- [ ] Ambiguous matches (multiple candidates found) flagged in ReportesHistorico and marked for manual review
- [ ] Versioned updates create new rows (don't overwrite); version column increments correctly
- [ ] Duplicate detection works: same (expediente, fecha, person_id) in same table skips import and flags in log
- [ ] ReportesHistorico entry created for EVERY import with fecha_importacion, match breakdown, any warnings/flags
- [ ] All import service code has unit tests with >80% coverage (MatchingService, NameNormalization, VersioningService, ImportLog logging)
- [ ] API endpoint `/api/import` POST accepts Excel file, returns import summary (matched_by_expediente, matched_by_name, unmatched, warnings)
- [ ] API endpoint `/api/expedientes/:numero/versions` returns all versions of an expediente with timestamps and source
- [ ] API endpoint `/api/person/:personId/table/:tableName/versions` returns version history for a person's table
- [ ] Rollback procedure tested: can remove import tables and API without affecting Obra functionality
- [ ] Documentation: schema diagram (14 models, relationships), import flow diagram, matching algorithm flowchart, API endpoint specs, example request/response for `/api/import`

## Timeline & Next Steps

**This proposal confirms**:
- Database design: 6 generic tables (Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados) + 8+ person tables (PiniHerrera, GabiPedrali, etc.) + Person model + ReportesHistorico
- Matching strategy: Dual-criteria (expediente exact match + name normalized match) across both table types
- Update strategy: Versioned inserts (no overwrites); create new rows with version tracking
- Re-import strategy: Create new versioned row if expediente + fecha combination differs or same-day reimport; full audit trail preserved
- Historic tracking: ReportesHistorico immutable log of all imports with fecha, source, match data
- Scope boundaries: backend service only; UI is deferred

**Ready for Spec Phase**: Detailed design specs covering:
1. Full Prisma schema for all 14 models with field types, indexes, foreign keys
2. NameNormalization algorithm (pseudocode + test cases)
3. Matching algorithm flowchart with priority order (generic tables → person tables)
4. VersioningService architecture (version incrementing, soft deletes, archive strategy)
5. ImportExcelService architecture and error recovery
6. API endpoint specifications (request/response schemas, error cases)
7. Test scenarios: single table match, multiple table conflict, versioning, re-import on different date, duplicate detection, name normalization edge cases, large file performance
