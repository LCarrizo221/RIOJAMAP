# Delta Specification: Excel Import with Multi-Table Tracking & Versioning

## Overview

This specification defines the complete technical design for automated daily Excel import (INFORME DIARIO) into RIOJAMAP's 14-table ecosystem. It includes:
- **Prisma schema** for 6 generic tables + 8 person-specific tables + Person model + ReportesHistorico
- **Zod validation contracts** (server & client)
- **API endpoints** with request/response schemas
- **Matching algorithm** with name normalization
- **Import service architecture**
- **Error handling matrix**
- **Test scenarios** with expected outcomes

---

## 1. ADDED Requirements

### Requirement: Generic Table Storage with Versioning

The system **SHALL** store 6 generic tables (Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados) with versioned updates (no overwrites). Each row MUST contain tracking metadata: id, expediente, nombre, referente, detalle, monto_total, monto_parcial, saldo, version, created_at, updated_at, imported_from.

**Prisma Models:**

```prisma
model Expedientes {
  id              Int       @id @default(autoincrement())
  expediente      String    @unique
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([version])
  @@index([createdAt])
}

model ConveniosMunic {
  id              Int       @id @default(autoincrement())
  expediente      String    @unique
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([version])
}

model DeudasEXPTES {
  id              Int       @id @default(autoincrement())
  expediente      String    @unique
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([version])
}

model Instituciones {
  id              Int       @id @default(autoincrement())
  expediente      String    @unique
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([version])
}

model Intendentes026 {
  id              Int       @id @default(autoincrement())
  expediente      String    @unique
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([version])
}

model Diputados {
  id              Int       @id @default(autoincrement())
  expediente      String    @unique
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([version])
}
```

#### Scenario: Insert and version a new expediente

- GIVEN an empty Expedientes table
- WHEN importing row { expediente: "EXP-2024-001", nombre: "Proyecto A", monto_total: 5000 }
- THEN a new Expedientes row is created with version=1, imported_from="INFORME_DIARIO", created_at=import_timestamp

#### Scenario: Re-import same expediente increments version

- GIVEN an existing Expedientes row { expediente: "EXP-2024-001", version: 1, monto_total: 5000 }
- WHEN re-importing { expediente: "EXP-2024-001", monto_total: 6000 }
- THEN a new row is created (or existing row updated) with version=2, updated_at=import_timestamp, monto_total=6000

---

### Requirement: Person-Specific Table Storage with 1:N Relationship

The system **SHALL** store 8+ person-specific tables (PiniHerrera, GabiPedrali, TeresitaMadera, FlorenciaLopez, GuryCaceres, Dirigentes, Romina, Misael) with 1:N relationship to Person model. Each table row MUST follow the same schema structure: id, expediente, nombre, referente, detalle, monto_total, monto_parcial, saldo, version, person_id, created_at, updated_at, imported_from.

**Prisma Models:**

```prisma
model Person {
  id                Int      @id @default(autoincrement())
  name              String
  table_name_alias  String   @unique  // e.g., "pini_herrera", "gabi_pedrali"
  createdAt         DateTime @default(now())
  
  piniHerrera       PiniHerrera[]
  gabiPedrali       GabiPedrali[]
  teresitaMadera    TeresitaMadera[]
  florenciaLopez    FlorenciaLopez[]
  guryCaceres       GuryCaceres[]
  dirigentes        Dirigentes[]
  romina            Romina[]
  misael            Misael[]
}

model PiniHerrera {
  id              Int       @id @default(autoincrement())
  expediente      String
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  person_id       Int
  person          Person    @relation(fields: [person_id], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([person_id])
  @@index([version])
  @@unique([expediente, person_id, createdAt])
}

model GabiPedrali {
  id              Int       @id @default(autoincrement())
  expediente      String
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  person_id       Int
  person          Person    @relation(fields: [person_id], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([person_id])
  @@index([version])
  @@unique([expediente, person_id, createdAt])
}

model TeresitaMadera {
  id              Int       @id @default(autoincrement())
  expediente      String
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  person_id       Int
  person          Person    @relation(fields: [person_id], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([person_id])
  @@index([version])
  @@unique([expediente, person_id, createdAt])
}

model FlorenciaLopez {
  id              Int       @id @default(autoincrement())
  expediente      String
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  person_id       Int
  person          Person    @relation(fields: [person_id], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([person_id])
  @@index([version])
  @@unique([expediente, person_id, createdAt])
}

model GuryCaceres {
  id              Int       @id @default(autoincrement())
  expediente      String
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  person_id       Int
  person          Person    @relation(fields: [person_id], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([person_id])
  @@index([version])
  @@unique([expediente, person_id, createdAt])
}

model Dirigentes {
  id              Int       @id @default(autoincrement())
  expediente      String
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  person_id       Int
  person          Person    @relation(fields: [person_id], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([person_id])
  @@index([version])
  @@unique([expediente, person_id, createdAt])
}

model Romina {
  id              Int       @id @default(autoincrement())
  expediente      String
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  person_id       Int
  person          Person    @relation(fields: [person_id], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([person_id])
  @@index([version])
  @@unique([expediente, person_id, createdAt])
}

model Misael {
  id              Int       @id @default(autoincrement())
  expediente      String
  nombre          String?
  referente       String?
  detalle         String?
  monto_total     Float     @default(0)
  monto_parcial   Float     @default(0)
  saldo           Float     @default(0)
  version         Int       @default(1)
  imported_from   String    @default("INFORME_DIARIO")
  person_id       Int
  person          Person    @relation(fields: [person_id], references: [id], onDelete: Cascade)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([expediente])
  @@index([person_id])
  @@index([version])
  @@unique([expediente, person_id, createdAt])
}
```

#### Scenario: Create person-specific record with foreign key constraint

- GIVEN Person { id: 1, name: "Pini Herrera", table_name_alias: "pini_herrera" }
- WHEN importing row { expediente: "PINI-001", nombre: "Subsidio", monto_total: 1000 } into PiniHerrera table
- THEN a new PiniHerrera row is created with person_id=1, version=1, created_at=import_timestamp

#### Scenario: Multiple versions of same expediente in person table

- GIVEN PiniHerrera row { id: 1, expediente: "PINI-001", person_id: 1, version: 1, monto_total: 1000, createdAt: "2024-01-01" }
- WHEN re-importing { expediente: "PINI-001", monto_total: 1500 } on 2024-01-02
- THEN a new PiniHerrera row is created (not updated) with version=2, monto_total=1500, createdAt="2024-01-02"

---

### Requirement: Historic Import Audit Trail (ReportesHistorico)

The system **SHALL** maintain an immutable ReportesHistorico table that logs every import transaction. Each log entry MUST capture: id, fecha_importacion, expediente, nombre, referente, monto, import_source_file, matched_table_type, matched_table_name, matched_by_expediente, matched_by_name, version_created, warnings, created_at.

**Prisma Model:**

```prisma
model ReportesHistorico {
  id                      Int       @id @default(autoincrement())
  fecha_importacion       DateTime  @default(now())
  expediente              String
  nombre                  String?
  referente               String?
  monto_total             Float     @default(0)
  monto_parcial           Float     @default(0)
  saldo                   Float     @default(0)
  import_source_file      String?   // filename of uploaded Excel
  matched_table_type      String?   // "Type1" or "Type2" or null if unmatched
  matched_table_name      String?   // "Expedientes", "PiniHerrera", etc.
  matched_by_expediente   Boolean   @default(false)
  matched_by_name         Boolean   @default(false)
  version_created         Int?      // version number of created/updated row
  warnings                String?   // JSON array of warning messages
  created_at              DateTime  @default(now())
  
  @@index([fecha_importacion])
  @@index([expediente])
  @@index([matched_table_type])
  @@index([matched_by_expediente])
  @@index([matched_by_name])
}
```

#### Scenario: Log successful import with expediente match

- GIVEN import of row { expediente: "EXP-2024-001", monto_total: 5000 }
- WHEN matching succeeds and Expedientes table is updated with version=1
- THEN ReportesHistorico row is created with matched_table_type="Type1", matched_table_name="Expedientes", matched_by_expediente=true, version_created=1

#### Scenario: Log unmatched row to audit trail

- GIVEN import of row { expediente: "UNKNOWN-999", nombre: "No Match" }
- WHEN matching fails in all tables
- THEN ReportesHistorico row is created with matched_table_type=null, matched_table_name=null, matched_by_expediente=false, warnings='["no_match_found"]'

---

### Requirement: Excel File Upload and Parsing

The system **MUST** accept Excel files via POST /api/import endpoint and parse them into structured rows. The endpoint MUST extract: expediente, nombre, referente, detalle, monto_total, monto_parcial, saldo, fecha from the INFORME DIARIO format.

**Request Schema:**

```
POST /api/import
Content-Type: multipart/form-data

{
  file: [Binary Excel file (.xlsx)],
  import_date: "2024-08-05" (optional; defaults to current date)
}
```

**Response Schema:**

```json
{
  "success": true,
  "summary": {
    "total_rows": 150,
    "matched_by_expediente": 120,
    "matched_by_name": 15,
    "unmatched": 10,
    "ambiguous": 5,
    "warnings": [
      "5 rows had ambiguous expediente matches (>1 candidate)",
      "3 rows had missing monto fields (treated as 0)",
      "1 row had null fecha (used import_date)"
    ]
  },
  "updated_rows": [
    {
      "table_type": "Type1",
      "table_name": "Expedientes",
      "row_id": 42,
      "expediente": "EXP-2024-001",
      "version_created": 1,
      "matched_by": "expediente_exact",
      "created_at": "2024-08-05T14:30:00Z"
    }
  ],
  "errors": []
}
```

#### Scenario: Parse valid Excel file with standard headers

- GIVEN a valid .xlsx file with headers: [expediente, nombre, referente, monto_total, monto_parcial, saldo, fecha]
- WHEN POST /api/import with file
- THEN response.success=true, response.summary.total_rows = count of data rows parsed

#### Scenario: Handle missing optional columns gracefully

- GIVEN an Excel file missing the "detalle" column
- WHEN parsing row { expediente: "EXP-001", nombre: "Test", monto_total: 1000 }
- THEN the row is parsed with detalle=null, no error thrown

---

### Requirement: Dual-Criteria Matching Algorithm

The system **MUST** implement a matching algorithm that searches BOTH generic tables (Type 1) and person-specific tables (Type 2) using two criteria in priority order:
1. **Priority A**: Exact, case-insensitive expediente match
2. **Priority B**: Normalized name match (Type 2 only)

If multiple candidates found, flag as ambiguous. If no match found, log as unmatched.

#### Scenario: Single expediente match in generic table

- GIVEN a row { expediente: "EXP-2024-001", nombre: "Test" }
- WHEN matching algorithm searches all tables
- THEN exactly 1 candidate found in Expedientes table, match_type='expediente_exact', match succeeds

#### Scenario: Ambiguous expediente match (multiple tables)

- GIVEN a row { expediente: "SHARED-001" } that exists in BOTH Expedientes and ConveniosMunic tables
- WHEN matching algorithm searches
- THEN 2 candidates found, match_type='ambiguous', warning logged to ReportesHistorico, row skipped

#### Scenario: Name match in person-specific table

- GIVEN a row { nombre: "PINI HERRERA", monto_total: 500 } with no expediente
- WHEN matching algorithm normalizes name to "PINI HERRERA" and searches PiniHerrera table
- THEN 1 match found, match_type='name_exact', match succeeds

---

### Requirement: Name Normalization Algorithm

The system **MUST** normalize person names to enable consistent matching across variations. Normalization MUST:
1. Convert to UPPERCASE
2. Trim leading/trailing whitespace and collapse internal spaces
3. Remove punctuation (commas, periods, dashes)
4. Compare normalized versions for exact match only (no fuzzy matching)

**Normalization Examples:**

| Input | Normalized | Notes |
|-------|-----------|-------|
| "MAZA ANGEL EDUARDO" | "MAZA ANGEL EDUARDO" | Already normalized |
| "Maza, Angel Eduardo" | "MAZA ANGEL EDUARDO" | Removes comma, uppercases |
| "maza  angel  eduardo" | "MAZA ANGEL EDUARDO" | Collapses spaces |
| "Maza - Angel Eduardo" | "MAZA ANGEL EDUARDO" | Removes dash, uppercases |

#### Scenario: Match person by normalized name variation

- GIVEN existing PiniHerrera row { nombre: "PINI HERRERA" }
- WHEN importing row { nombre: "Pini, Herrera" }
- THEN normalized name "PINI HERRERA" matches existing row, match succeeds

#### Scenario: Different names do not match after normalization

- GIVEN existing PiniHerrera row { nombre: "PINI HERRERA" }
- WHEN importing row { nombre: "PINI HERRERA JR" }
- THEN normalized names do NOT match ("PINI HERRERA" ≠ "PINI HERRERA JR"), no match

---

### Requirement: Versioned Updates (Non-Destructive)

The system **MUST** create new rows when importing data instead of overwriting existing rows. Each row MUST increment its version counter and preserve created_at timestamp. The updated_at timestamp MUST reflect the most recent import date.

**Versioning Rules:**
- First import: version=1, created_at=import_timestamp, updated_at=import_timestamp
- Subsequent import (same expediente/person_id, different data): version++, created_at=original_timestamp, updated_at=new_import_timestamp
- A row is considered "updated" if ANY field differs from the previous version (monto_total, monto_parcial, saldo, etc.)

#### Scenario: Track full version history for an expediente

- GIVEN Expedientes row v1: { expediente: "EXP-001", monto_total: 1000, version: 1, created_at: "2024-08-01" }
- WHEN re-importing same expediente with monto_total=1500 on 2024-08-02
- THEN a new row is created: version=2, created_at="2024-08-01" (unchanged), updated_at="2024-08-02", monto_total=1500
- AND query /api/expedientes/EXP-001/versions returns BOTH v1 and v2 with timestamps

#### Scenario: Version increments only on data change

- GIVEN Expedientes row { expediente: "EXP-002", monto_total: 2000, version: 1 }
- WHEN re-importing identical row { expediente: "EXP-002", monto_total: 2000 }
- THEN no new version is created; existing row's updated_at remains unchanged (or is set to import_date for audit)

---

### Requirement: Duplicate Detection

The system **MUST** detect and skip duplicate imports. A duplicate is defined as a row with the same (expediente, person_id, import_date) tuple already present in the same table at the same or later version.

**Duplicate Rules:**
- Check if (expediente, person_id, import_date) tuple exists in target table
- If yes AND version_on_file ≤ existing_version, skip import and flag in ReportesHistorico
- If no OR version_on_file > existing_version, create new versioned row

#### Scenario: Skip duplicate import on same day

- GIVEN Expedientes row { expediente: "EXP-003", version: 1, imported_at: "2024-08-05T10:00:00Z" }
- WHEN re-importing same row on 2024-08-05 (same day)
- THEN duplicate detected, row skipped, warning logged to ReportesHistorico as "duplicate_import_same_day"

#### Scenario: Allow re-import on different day

- GIVEN Expedientes row { expediente: "EXP-003", version: 1, imported_at: "2024-08-05T10:00:00Z" }
- WHEN importing same expediente on 2024-08-06 with different monto_total
- THEN no duplicate; new row created with version=2, imported_at="2024-08-06T10:00:00Z"

---

### Requirement: API Endpoints for Version History

The system **MUST** expose two read-only API endpoints to retrieve version history:

**Endpoint 1: GET /api/expedientes/:numero/versions**
- Returns all versions of a specific expediente across all Type 1 tables
- Response: { expediente, versions: [{ version, created_at, updated_at, data: {...}, imported_from, table_name }] }
- Filtering: by version number, date range, or table type

**Endpoint 2: GET /api/person/:personId/table/:tableName/versions**
- Returns version history for a specific person's table (e.g., PiniHerrera)
- Response: { person_id, table_name, rows: [{ id, version, created_at, updated_at, data: {...}, imported_from }] }

#### Scenario: Retrieve expediente version history

- GIVEN Expedientes table with versions v1, v2, v3 of expediente "EXP-001"
- WHEN GET /api/expedientes/EXP-001/versions
- THEN response contains all 3 versions with timestamps and monto changes

#### Scenario: Retrieve person table version history

- GIVEN PiniHerrera table with 2 versions of person_id=5's record
- WHEN GET /api/person/5/table/pini_herrera/versions
- THEN response lists both versions with version numbers and updated timestamps

---

### Requirement: Zod Schema Validation Contracts

The system **MUST** define Zod schemas for all import-related data types. Schemas MUST be shared between backend and client (frontend) for runtime validation.

**File: server/src/schemas/import.ts**

```typescript
import { z } from 'zod';

// Generic table schemas
export const ExpeditentSchema = z.object({
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

export const ConvenioSchema = z.object({
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

export const DeudaSchema = z.object({
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

// Person model
export const PersonSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  table_name_alias: z.string().min(1),
  createdAt: z.date().optional(),
});

// Person table schemas
export const PiniHerreraSchema = z.object({
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
  person_id: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ReportesHistorico schema
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
  matched_table_type: z.string().nullable().optional(), // "Type1" | "Type2"
  matched_table_name: z.string().nullable().optional(),
  matched_by_expediente: z.boolean().default(false),
  matched_by_name: z.boolean().default(false),
  version_created: z.number().nullable().optional(),
  warnings: z.string().nullable().optional(), // JSON-stringified array
  created_at: z.date().optional(),
});

// Import request/response schemas
export const ImportRequestSchema = z.object({
  file: z.instanceof(File),
  import_date: z.string().datetime().optional(),
});

export const ImportResponseSchema = z.object({
  success: z.boolean(),
  summary: z.object({
    total_rows: z.number(),
    matched_by_expediente: z.number(),
    matched_by_name: z.number(),
    unmatched: z.number(),
    ambiguous: z.number(),
    warnings: z.string().array(),
  }),
  updated_rows: z.array(z.object({
    table_type: z.string(),
    table_name: z.string(),
    row_id: z.number(),
    expediente: z.string(),
    version_created: z.number(),
    matched_by: z.string(),
    created_at: z.string().datetime(),
  })),
  errors: z.string().array(),
});

export type ImportResponse = z.infer<typeof ImportResponseSchema>;
```

#### Scenario: Validate import request with Zod

- GIVEN a FormData with file and optional import_date
- WHEN parsing with ImportRequestSchema.parse()
- THEN validation succeeds if file is present and import_date (if provided) is ISO8601 format

#### Scenario: Validate row data with table schema

- GIVEN row object { expediente: "EXP-001", monto_total: "invalid" }
- WHEN parsing with ExpeditentSchema.parse()
- THEN Zod throws validation error: monto_total must be number

---

## 2. Error Handling Matrix

| Error Scenario | Condition | Response | Action | ReportesHistorico Entry |
|---|---|---|---|---|
| **Missing expediente** | Row has no expediente field | Skip row | Log warning | warning: "missing_expediente" |
| **Invalid monto** | monto_total is non-numeric string | Treat as 0 | Continue | warning: "monto_default_zero" |
| **Missing fecha** | Row has no fecha/import_date | Use import_date param | Continue | warning: "fecha_defaulted" |
| **Ambiguous match** | Multiple candidates found for expediente | Skip row | Log warning | matched_table_type=null, warning: "ambiguous_match" |
| **No match** | No match found in any table | Skip row | Log info | matched_table_type=null, matched_by_expediente=false |
| **Duplicate import** | (expediente, person_id, fecha) exists | Skip row | Log warning | warning: "duplicate_import_same_day" |
| **Excel parse error** | Merged cells or corrupted sheet | Skip row | Log error | warning: "excel_parse_error" |
| **Invalid Zod schema** | Row fails Zod validation | Skip row | Log validation errors | warning: JSON stringified validation errors |
| **Database constraint violation** | Unique index conflict | Rollback row transaction | Log error | error: "database_constraint_error" |
| **Person FK missing** | person_id references non-existent Person | Skip row | Log error | error: "person_fk_not_found" |

---

## 3. Import Service Architecture

**File: server/src/services/import/ImportExcelService.ts**

```typescript
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { MatchingService } from './MatchingService';
import { NameNormalizationService } from './NameNormalizationService';
import { ImportRequestSchema, ImportResponseSchema } from '../../schemas/import';
import { z } from 'zod';

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

export class ImportExcelService {
  constructor(
    private prisma: PrismaClient,
    private matchingService: MatchingService,
    private nameNormalizationService: NameNormalizationService,
  ) {}

  /**
   * Parse Excel file into structured rows
   */
  async parseExcelFile(file: File): Promise<ImportRow[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet);
    
    return rows.map(row => ({
      expediente: String(row.expediente || '').trim(),
      nombre: row.nombre ? String(row.nombre).trim() : undefined,
      referente: row.referente ? String(row.referente).trim() : undefined,
      detalle: row.detalle ? String(row.detalle).trim() : undefined,
      monto_total: Number(row.monto_total) || 0,
      monto_parcial: Number(row.monto_parcial) || 0,
      saldo: Number(row.saldo) || 0,
      fecha: row.fecha ? new Date(row.fecha) : undefined,
    }));
  }

  /**
   * Main import flow: process all rows, match, version, log
   */
  async executeImport(
    file: File,
    importDate: Date = new Date(),
  ): Promise<z.infer<typeof ImportResponseSchema>> {
    const rows = await this.parseExcelFile(file);
    
    const result = {
      success: true,
      summary: {
        total_rows: rows.length,
        matched_by_expediente: 0,
        matched_by_name: 0,
        unmatched: 0,
        ambiguous: 0,
        warnings: [] as string[],
      },
      updated_rows: [] as any[],
      errors: [] as string[],
    };

    for (const row of rows) {
      try {
        const match = await this.matchingService.matchImportRow(row);
        
        if (match.match_type === 'expediente_exact') {
          const created = await this.createVersionedRow(
            match.table_name,
            row,
            match.row.version + 1,
            importDate,
          );
          result.updated_rows.push(created);
          result.summary.matched_by_expediente++;
        } else if (match.match_type === 'name_exact') {
          const created = await this.createVersionedRow(
            match.table_name,
            row,
            1,
            importDate,
          );
          result.updated_rows.push(created);
          result.summary.matched_by_name++;
        } else if (match.match_type === 'ambiguous') {
          result.summary.ambiguous++;
          result.summary.warnings.push(
            `Row with expediente '${row.expediente}' has ${match.candidates?.length || 0} ambiguous matches`,
          );
          await this.logToReportesHistorico(row, {
            matched_table_type: null,
            matched_table_name: null,
            warnings: JSON.stringify(['ambiguous_match']),
          }, importDate, file.name);
        } else {
          result.summary.unmatched++;
          await this.logToReportesHistorico(row, {
            matched_table_type: null,
            matched_table_name: null,
            warnings: JSON.stringify(['no_match_found']),
          }, importDate, file.name);
        }
      } catch (error) {
        result.errors.push(`Error processing row ${row.expediente}: ${String(error)}`);
      }
    }

    return result;
  }

  /**
   * Create versioned row in target table
   */
  private async createVersionedRow(
    tableName: string,
    row: ImportRow,
    version: number,
    importDate: Date,
  ) {
    const data = {
      expediente: row.expediente,
      nombre: row.nombre || null,
      referente: row.referente || null,
      detalle: row.detalle || null,
      monto_total: row.monto_total,
      monto_parcial: row.monto_parcial,
      saldo: row.saldo,
      version,
      imported_from: 'INFORME_DIARIO',
      updatedAt: importDate,
    };

    // Create in appropriate table (simplified; real implementation branches on tableName)
    const result = await (this.prisma as any)[tableName].create({ data });
    
    return {
      table_type: 'Type1',
      table_name: tableName,
      row_id: result.id,
      expediente: result.expediente,
      version_created: version,
      matched_by: 'expediente_exact',
      created_at: result.createdAt,
    };
  }

  /**
   * Log import to ReportesHistorico
   */
  private async logToReportesHistorico(
    row: ImportRow,
    metadata: any,
    importDate: Date,
    sourceFile: string,
  ) {
    await this.prisma.reportesHistorico.create({
      data: {
        expediente: row.expediente,
        nombre: row.nombre || null,
        referente: row.referente || null,
        monto_total: row.monto_total,
        monto_parcial: row.monto_parcial,
        saldo: row.saldo,
        import_source_file: sourceFile,
        matched_table_type: metadata.matched_table_type,
        matched_table_name: metadata.matched_table_name,
        matched_by_expediente: metadata.matched_table_type === 'Type1',
        matched_by_name: metadata.matched_by_name || false,
        warnings: metadata.warnings,
        fecha_importacion: importDate,
      },
    });
  }
}
```

---

## 4. Matching Algorithm (Detailed Pseudocode)

```
FUNCTION matchImportRow(row: ImportRow) -> MatchResult
  expediente = row.expediente
  nombre_normalized = normalizeNombre(row.nombre)
  
  // PRIORITY 1: Search Type 1 tables (generic) for expediente match
  FOR EACH table IN [Expedientes, ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados]
    matches = db.query(table, WHERE expediente = expediente CASE-INSENSITIVE)
    
    IF matches.length == 1
      RETURN {
        match_type: "expediente_exact",
        table_name: table.name,
        row: matches[0],
        table_type: "Type1"
      }
    END IF
    
    IF matches.length > 1
      // Ambiguous within single table
      log_warning("ambiguous_match_expediente_in_table", { table: table.name, count: matches.length })
      // Continue to check other tables for this expediente
    END IF
  END FOR
  
  // If found ambiguous in multiple tables, flag overall ambiguity
  IF found_in_multiple_tables
    RETURN {
      match_type: "ambiguous",
      candidates: all_matches,
      reason: "expediente_exists_in_multiple_tables"
    }
  END IF
  
  // PRIORITY 2: Search Type 2 tables (person) for name match
  FOR EACH person_table IN [PiniHerrera, GabiPedrali, TeresitaMadera, FlorenciaLopez, GuryCaceres, Dirigentes, Romina, Misael]
    matches = db.query(person_table, WHERE normalizeNombre(nombre) = nome_normalized)
    
    IF matches.length == 1
      RETURN {
        match_type: "name_exact",
        table_name: person_table.name,
        row: matches[0],
        table_type: "Type2"
      }
    END IF
    
    IF matches.length > 1
      log_warning("ambiguous_match_name_in_table", { table: person_table.name, count: matches.length })
      // Continue checking other person tables
    END IF
  END FOR
  
  // No match found anywhere
  RETURN {
    match_type: "no_match",
    reason: "expediente_and_name_not_found"
  }
END FUNCTION
```

---

## 5. Name Normalization Algorithm

```
FUNCTION normalizeNombre(input: String) -> String
  IF input IS NULL OR EMPTY
    RETURN ""
  END IF
  
  result = input
  
  // Step 1: Convert to uppercase
  result = result.toUpperCase()
  
  // Step 2: Trim and collapse whitespace
  result = result.trim()
  result = result.replace(/\s+/g, ' ')  // Replace multiple spaces with single space
  
  // Step 3: Remove punctuation
  result = result.replace(/[,\.\-]/g, '')  // Remove commas, periods, dashes
  
  RETURN result
END FUNCTION

// Test cases
assert normalizeNombre("MAZA ANGEL EDUARDO") == "MAZA ANGEL EDUARDO"
assert normalizeNombre("Maza, Angel Eduardo") == "MAZA ANGEL EDUARDO"
assert normalizeNombre("maza  angel  EDUARDO") == "MAZA ANGEL EDUARDO"
assert normalizeNombre("Maza - Angel - Eduardo") == "MAZA ANGEL EDUARDO"
assert normalizeNombre("  pini herrera  ") == "PINI HERRERA"
```

---

## 6. Test Scenarios with Expected Outcomes

| Test Case | Given | When | Then | Expected Result |
|---|---|---|---|---|
| **Single expediente match** | Expedientes table with EXP-001 | Import row { expediente: "EXP-001" } | Match found | version=1, imported_from="INFORME_DIARIO", ReportesHistorico matched_by_expediente=true |
| **Version increment** | Expedientes row v1 { EXP-001 } | Import same EXP-001 with different monto | New row created | version=2, created_at=original, updated_at=new |
| **Ambiguous match** | Expedientes & ConveniosMunic both have EXP-SHARED | Import row { expediente: "EXP-SHARED" } | Ambiguous detected | Row skipped, ReportesHistorico warnings=["ambiguous_match"], matched_table_type=null |
| **Name match in Type 2** | PiniHerrera { nombre: "PINI HERRERA" } | Import { nombre: "pini herrera" } | Name normalized & matched | version=1, table_name=PiniHerrera, matched_by_name=true |
| **No match** | All tables empty | Import { expediente: "UNKNOWN-999" } | No match found | Row skipped, ReportesHistorico warnings=["no_match_found"] |
| **Duplicate same day** | Expedientes { EXP-001, imported_at: "2024-08-05T10:00" } | Re-import EXP-001 on same day | Duplicate detected | Row skipped, ReportesHistorico warnings=["duplicate_import_same_day"] |
| **Re-import next day** | Expedientes { EXP-001, v1, imported_at: "2024-08-05" } | Import EXP-001 on 2024-08-06 | New version created | version=2, created_at=2024-08-05, updated_at=2024-08-06 |
| **Null monto handling** | Expedientes table empty | Import { expediente: "EXP-NULL", monto_total: null } | Monto treated as 0 | monto_total=0, ReportesHistorico warnings=["monto_default_zero"] |
| **Null fecha handling** | Expedientes table empty | Import { expediente: "EXP-FECHA", fecha: null }, import_date="2024-08-05" | Fecha uses import_date | imported_at=2024-08-05, ReportesHistorico warnings=["fecha_defaulted"] |
| **Large file performance** | 500+ rows to import | POST /api/import with 500-row Excel | Processing completes in <5 sec | summary.total_rows=500, response.success=true |
| **Name normalization edge case** | PiniHerrera { nombre: "Maza - Angel - Eduardo" } | Import { nombre: "MAZA ANGEL EDUARDO" } | Normalized names match | Match succeeds, version=1 |
| **Person FK constraint** | PiniHerrera requires person_id=99 | Import row without creating Person | DB constraint violation | Error logged, row skipped, ReportesHistorico error: "person_fk_not_found" |
| **Excel parse error (merged cells)** | Excel file with merged cells | POST /api/import | Parse error handled | Merged cell rows skipped, warnings logged, summary completes with unmatched count |
| **Empty Excel file** | Excel file with headers but no data rows | POST /api/import | No rows to import | summary.total_rows=0, summary.warnings=["no_data_rows"], success=true |

---

## 7. Database Migration Strategy

### Migration: Create Import Tables (001-create-import-tables)

```sql
-- Create Person model
CREATE TABLE "Person" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "table_name_alias" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Create 6 generic Type 1 tables
CREATE TABLE "Expedientes" (
  "id" SERIAL NOT NULL,
  "expediente" TEXT NOT NULL UNIQUE,
  "nombre" TEXT,
  "referente" TEXT,
  "detalle" TEXT,
  "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

-- Repeat for ConveniosMunic, DeudasEXPTES, Instituciones, Intendentes026, Diputados

-- Create 8 person-specific Type 2 tables
CREATE TABLE "PiniHerrera" (
  "id" SERIAL NOT NULL,
  "expediente" TEXT NOT NULL,
  "nombre" TEXT,
  "referente" TEXT,
  "detalle" TEXT,
  "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
  "person_id" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PiniHerrera_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id"),
  UNIQUE ("expediente", "person_id", "createdAt")
);

-- Repeat for GabiPedrali, TeresitaMadera, FlorenciaLopez, GuryCaceres, Dirigentes, Romina, Misael

-- Create ReportesHistorico table
CREATE TABLE "ReportesHistorico" (
  "id" SERIAL NOT NULL,
  "fecha_importacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expediente" TEXT NOT NULL,
  "nombre" TEXT,
  "referente" TEXT,
  "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "import_source_file" TEXT,
  "matched_table_type" TEXT,
  "matched_table_name" TEXT,
  "matched_by_expediente" BOOLEAN NOT NULL DEFAULT false,
  "matched_by_name" BOOLEAN NOT NULL DEFAULT false,
  "version_created" INTEGER,
  "warnings" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX "Expedientes_expediente_idx" ON "Expedientes"("expediente");
CREATE INDEX "Expedientes_version_idx" ON "Expedientes"("version");
CREATE INDEX "Expedientes_createdAt_idx" ON "Expedientes"("createdAt");

CREATE INDEX "PiniHerrera_expediente_idx" ON "PiniHerrera"("expediente");
CREATE INDEX "PiniHerrera_person_id_idx" ON "PiniHerrera"("person_id");
CREATE INDEX "PiniHerrera_version_idx" ON "PiniHerrera"("version");

CREATE INDEX "ReportesHistorico_fecha_importacion_idx" ON "ReportesHistorico"("fecha_importacion");
CREATE INDEX "ReportesHistorico_expediente_idx" ON "ReportesHistorico"("expediente");
CREATE INDEX "ReportesHistorico_matched_table_type_idx" ON "ReportesHistorico"("matched_table_type");
```

---

## 8. Performance Considerations

| Consideration | Strategy | Rationale |
|---|---|---|
| **Matching speed** | Index on expediente, person_id, nombre_normalized | O(log n) lookup instead of O(n) full table scan |
| **Versioning row explosion** | Archive strategy (move versions >30 days old to archive table) | Keep hot table small; maintain full history |
| **Large imports (500+ rows)** | Batch processing in transactions (100 rows per transaction) | Prevent OOM; allow rollback per batch |
| **Name matching** | Compute normalization once per import; cache if needed | Avoid repeated normalization in inner loops |
| **Query pagination** | Version history endpoints return max 100 versions per page | Prevent large result sets for frequently-updated records |
| **Duplicate detection** | Unique constraint on (expediente, person_id, createdAt) + query on (expediente, fecha, version) | DB enforces uniqueness; query uses index |

---

## 9. Conclusion

This delta specification defines all requirements, schemas, algorithms, and test scenarios for the Excel Import feature with multi-table tracking and versioning. The specification is contract-first (Zod schemas shared across frontend/backend), uses event-driven logging (ReportesHistorico for audit), and follows non-destructive versioning patterns.

**Ready for Design phase**: Detailed architecture and implementation decisions per service.

**Ready for Task phase**: Break design into implementation work units (schema migration, service classes, API endpoints, tests).
