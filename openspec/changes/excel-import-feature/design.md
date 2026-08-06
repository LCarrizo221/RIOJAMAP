# Design: Excel Import with Multi-Table Tracking & Versioning

## Technical Approach

Introduce a layered import pipeline on top of the existing Express/Prisma/Zod stack. The pipeline follows a strict sequence: **parse → match → version → log**. A thin `controllers/` layer is added to keep routes declarative (matching the existing `obras.ts` style). All services live under `services/import/`. Client contracts mirror server schemas with `.strict()` for drift detection, consistent with `contracts/obra.ts`.

---

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|---|---|---|---|
| **Type1 versioning** | INSERT new row vs UPDATE in-place | UPDATE in-place (upsert) | `expediente @unique` in Type1 schema — inserting a duplicate expediente violates the DB constraint; `version++` tracked via update |
| **Type2 versioning** | UPDATE vs INSERT new row | INSERT new row | No unique constraint on `expediente` alone in person tables; `@@unique([expediente, person_id, createdAt])` explicitly supports multiple rows per expediente |
| **Excel parser** | xlsx (used in spec code) vs exceljs | **exceljs** | Per project requirement; better streaming support for large files; header detection API |
| **File upload** | busboy vs multer | **multer (memoryStorage)** | Already common in Node/Express; `memoryStorage()` keeps file in-process as Buffer without temp files; max 10 MB is safe for memory |
| **Name matching** | fuzzy (Levenshtein) vs exact normalized | **Exact normalized only** | Spec explicitly rules out fuzzy matching; false positive risk is high with common Argentine surnames |
| **Controller layer** | Inline routes (current pattern) vs controllers/ | **Introduce controllers/** | Routes grow complex with file upload + auth + rate limit + error handling; thin controller isolates business logic |
| **Rate limiter** | express-rate-limit vs custom | **express-rate-limit** | No rate limiter exists in project; `generalApiLimiter` exported from `src/middleware/rateLimit.ts` |
| **Matching parallelism** | Sequential vs Promise.all | **Hybrid** | Type1 expediente: sequential (need to detect multi-table ambiguity); Type2 name: `Promise.all` (independent tables, no ambiguity cross-check needed at this layer) |
| **Row transaction scope** | Per-row vs per-batch | **Per-row Prisma transaction** | One bad row must not roll back 99 good rows; batch processing in 100-row chunks with individual `try/catch` |

---

## Data Flow

```
POST /api/import
     │
     ├─ multer (memoryStorage, 10MB, .xlsx only)
     ├─ authenticate (JWT cookie)
     ├─ generalApiLimiter
     │
     ▼
importController.uploadFile()
     │
     ▼
ImportExcelService.importFile(buffer, importDate)
     │
     ├─ parseFile(buffer) → ImportRow[]       [exceljs: first non-empty row = headers, case-insensitive map]
     │
     └─ for chunks of 100 rows:
          for each row (try/catch):
             │
             ├─ MatchingService.match(row)
             │    ├─ Type1 loop: sequential search by expediente (ILIKE)
             │    │   detects multi-table ambiguity
             │    └─ Type2 parallel: Promise.all → name normalized ILIKE search
             │
             ├─ match_type = 'expediente_exact'
             │    └─ VersioningService.createVersionedRow()
             │         ├─ Type1: prisma[table].upsert({ where: {expediente}, update: {version: v+1, ...} })
             │         └─ Type2: prisma[table].create({ data: {version: v+1, ...} })
             │
             ├─ match_type = 'name_exact'
             │    └─ VersioningService.createVersionedRow() → Type2 INSERT
             │
             ├─ match_type = 'ambiguous' | 'no_match'
             │    └─ skip row (no DB write)
             │
             └─ ReportesHistoricoService.log(entry)   ← ALWAYS, for every row
                  [immutable audit; never rolled back]
     │
     ▼
ImportResponseSchema (summary + updated_rows + errors)
```

---

## File Changes

| File | Action | Description |
|---|---|---|
| `server/prisma/schema.prisma` | Modify | Add 16 new models: Person, 6 Type1, 8 Type2, ReportesHistorico |
| `server/prisma/migrations/YYYYMMDD_excel_import_tables/migration.sql` | Create | Ordered DDL: Person → Type2 tables → Type1 tables → ReportesHistorico; all indexes |
| `server/prisma/seed-persons.ts` | Create | Seed 8 Person records with `table_name_alias` |
| `server/src/routes/import.ts` | Create | 4 Express routes; apply authenticate + generalApiLimiter + multer middleware |
| `server/src/controllers/importController.ts` | Create | Thin controller methods; try/catch → standardized error shape |
| `server/src/services/import/types.ts` | Create | TypeScript interfaces: ImportRow, MatchResult, ImportResult, ReportesHistoricoEntry |
| `server/src/services/import/ImportExcelService.ts` | Create | parseFile + importFile; chunked batch loop |
| `server/src/services/import/NameNormalizationService.ts` | Create | normalize() + compare(); pure functions, no Prisma dependency |
| `server/src/services/import/MatchingService.ts` | Create | match(); Type1 sequential + Type2 Promise.all |
| `server/src/services/import/VersioningService.ts` | Create | createVersionedRow + getLatestVersion + isDuplicate |
| `server/src/services/import/ReportesHistoricoService.ts` | Create | log(); always fires, never throws (wraps errors to prevent log failure aborting import) |
| `server/src/schemas/import.ts` | Create | All Zod schemas (see below) |
| `server/src/middleware/rateLimit.ts` | Create | `generalApiLimiter` via express-rate-limit |
| `server/src/index.ts` | Modify | Register `/api/import` routes |
| `client/src/contracts/import.ts` | Create | Client-side mirrors: ImportResponseContract, ReportesHistoricoContract, VersionHistoryContract |
| `client/src/api/import.ts` | Create | `postImport()`, `getVersionsByExpediente()`, `getPersonVersions()`, `getReportesHistorico()` |
| `client/src/api/import.test.ts` | Create | Vitest + MSW tests for all 4 API methods |

---

## Interfaces / Contracts

### Service Types (`services/import/types.ts`)

```typescript
export interface ImportRow {
  expediente: string;
  nombre?: string;
  referente?: string;
  detalle?: string;
  monto_total: number;
  monto_parcial: number;
  saldo: number;
  fecha?: Date;
}

export type MatchType = 'expediente_exact' | 'name_exact' | 'ambiguous' | 'no_match';
export type TableType = 'Type1' | 'Type2';

export interface MatchResult {
  match_type: MatchType;
  table_type?: TableType;
  table_name?: string;
  matched_row?: { id: number; version: number; [key: string]: unknown };
  candidates?: unknown[];
}

export interface VersionedRowResult {
  table_type: TableType;
  table_name: string;
  row_id: number;
  expediente: string;
  version_created: number;
  matched_by: MatchType;
  created_at: string;
}

export interface ImportResult {
  success: boolean;
  summary: {
    total_rows: number;
    matched_by_expediente: number;
    matched_by_name: number;
    unmatched: number;
    ambiguous: number;
    warnings: string[];
  };
  updated_rows: VersionedRowResult[];
  errors: string[];
}

export interface ReportesHistoricoEntry {
  expediente: string;
  nombre?: string;
  referente?: string;
  monto_total: number;
  monto_parcial: number;
  saldo: number;
  import_source_file?: string;
  matched_table_type?: string;
  matched_table_name?: string;
  matched_by_expediente: boolean;
  matched_by_name: boolean;
  version_created?: number;
  warnings?: string;
  fecha_importacion: Date;
}
```

### Zod Schemas (`server/src/schemas/import.ts`) — key definitions

```typescript
// Shared row shape (DRY base for all 14 table schemas)
const BaseTableRowSchema = z.object({
  id: z.number().optional(),
  expediente: z.string().min(1),
  nombre: z.string().nullable().optional(),
  referente: z.string().nullable().optional(),
  detalle: z.string().nullable().optional(),
  monto_total: z.number().default(0),
  monto_parcial: z.number().default(0),
  saldo: z.number().default(0),
  version: z.number().default(1),
  imported_from: z.string().default('INFORME_DIARIO'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Type1 schemas: re-export BaseTableRowSchema as named aliases
export const ExpeditentSchema = BaseTableRowSchema;
export const ConvenioSchema   = BaseTableRowSchema;
export const DeudaSchema      = BaseTableRowSchema;
export const InstitucionSchema = BaseTableRowSchema;
export const IntendenteSchema  = BaseTableRowSchema;
export const DiputadoSchema    = BaseTableRowSchema;

// Type2 schemas: extend with person_id
export const PersonTableRowSchema = BaseTableRowSchema.extend({
  person_id: z.number(),
});

export const PersonSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  table_name_alias: z.string().min(1),
  createdAt: z.date().optional(),
});

export const ReportesHistoricoSchema = z.object({
  id: z.number().optional(),
  fecha_importacion: z.date().default(() => new Date()),
  expediente: z.string().min(1),
  nombre: z.string().nullable().optional(),
  referente: z.string().nullable().optional(),
  monto_total: z.number().default(0),
  monto_parcial: z.number().default(0),
  saldo: z.number().default(0),
  import_source_file: z.string().nullable().optional(),
  matched_table_type: z.string().nullable().optional(),
  matched_table_name: z.string().nullable().optional(),
  matched_by_expediente: z.boolean().default(false),
  matched_by_name: z.boolean().default(false),
  version_created: z.number().nullable().optional(),
  warnings: z.string().nullable().optional(),
  created_at: z.date().optional(),
});

// Note: ImportRequestSchema validates text fields only.
// File validation is handled by multer middleware (type + size).
export const ImportRequestSchema = z.object({
  import_date: z.string().datetime().optional(),
});

export const MatchResultSchema = z.object({
  match_type: z.enum(['expediente_exact', 'name_exact', 'ambiguous', 'no_match']),
  table_type: z.enum(['Type1', 'Type2']).optional(),
  table_name: z.string().optional(),
  matched_row_id: z.number().optional(),
  candidates: z.array(z.unknown()).optional(),
});

export const ImportSummarySchema = z.object({
  total_rows: z.number(),
  matched_by_expediente: z.number(),
  matched_by_name: z.number(),
  unmatched: z.number(),
  ambiguous: z.number(),
  warnings: z.array(z.string()),
});

export const ImportResponseSchema = z.object({
  success: z.boolean(),
  summary: ImportSummarySchema,
  updated_rows: z.array(z.object({
    table_type: z.string(),
    table_name: z.string(),
    row_id: z.number(),
    expediente: z.string(),
    version_created: z.number(),
    matched_by: z.string(),
    created_at: z.string().datetime(),
  })),
  errors: z.array(z.string()),
});
```

### Client Contracts (`client/src/contracts/import.ts`)

```typescript
// Mirror with .strict() for drift detection — same as contracts/obra.ts pattern
export const ImportResponseContract = ImportResponseSchema.strict();
export const ReportesHistoricoContract = ReportesHistoricoSchema.strict();
export const VersionHistoryContract = z.object({
  expediente: z.string(),
  versions: z.array(z.object({
    version: z.number(),
    table_name: z.string(),
    imported_from: z.string(),
    monto_total: z.number(),
    monto_parcial: z.number(),
    saldo: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
  })),
}).strict();
```

---

## API Route Design

```
multer fileFilter: .xlsx only, maxSize 10MB
authenticate: JWT cookie (existing middleware, named `authenticate`)
generalApiLimiter: express-rate-limit, 20 req/min per IP (new middleware)

POST   /api/import
       multer → authenticate → generalApiLimiter → importController.uploadFile
       Returns: ImportResponseSchema

GET    /api/expedientes/:numero/versions
       authenticate → importController.getExpedienteVersions
       Returns: VersionHistoryContract

GET    /api/person/:personId/table/:tableName/versions
       authenticate → importController.getPersonVersions
       Returns: { person_id, table_name, rows: [...] }

GET    /api/reportes-historico
       authenticate → importController.getReportesHistorico
       Query: fecha_from, fecha_to, table_type, matched_by, page, limit
       Returns: paginated ReportesHistoricoSchema[]
```

Error response shape (all 4xx/5xx):
```typescript
{ error: string; code: string; details?: unknown }
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | NameNormalizationService.normalize() | Vitest; pure function; all edge cases from spec table |
| Unit | MatchingService.match() | Vitest; mock Prisma; test each match_type branch |
| Unit | VersioningService.isDuplicate() | Vitest; mock Prisma; same-day vs next-day |
| Unit | ImportExcelService.parseFile() | Vitest; read fixture .xlsx; assert ImportRow[] shape |
| Integration | POST /api/import | Vitest + MSW; mock multipart; assert ImportResponseContract |
| Integration | GET /api/reportes-historico | Vitest + MSW; mock paginated response; assert contract |
| RED tests | Duplicate import same day | Assert warnings includes "duplicate_import_same_day" |
| RED tests | Ambiguous expediente | Assert match_type='ambiguous', row skipped |
| RED tests | Missing person FK | Assert error logged, row skipped, import continues |

---

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary in this change. File upload is validated by multer (MIME type + extension + size) before any parsing occurs.

---

## Migration / Rollout

**Migration order** (single file `server/prisma/migrations/YYYYMMDD_excel_import_tables/migration.sql`):
1. `Person` (no FK dependencies)
2. 8 Type2 tables (`PiniHerrera`, `GabiPedrali`, etc.) — FK to `Person`
3. 6 Type1 tables (`Expedientes`, `ConveniosMunic`, `DeudasEXPTES`, `Instituciones`, `Intendentes026`, `Diputados`) — no FK
4. `ReportesHistorico` — no FK (standalone audit log)
5. All indexes from spec (expediente, person_id, version, createdAt, composite)

**Seed** (`server/prisma/seed-persons.ts`): Run after migration. Inserts 8 `Person` records. Referenced by `MatchingService` at boot via `prisma.person.findMany()` to build an in-memory alias→id map.

**No feature flag needed** — endpoint is new, no existing functionality changes.

---

## Dependencies to Install

```bash
# Server
npm install multer exceljs express-rate-limit
npm install --save-dev @types/multer

# Client — no new deps (fetch API + existing Zod)
```

> `string-similarity` / `fuzzyset.js` — **NOT required**. Spec explicitly mandates exact normalized matching only. Fuzzy matching removed to prevent false positives.

---

## Open Questions

- None that block implementation.
