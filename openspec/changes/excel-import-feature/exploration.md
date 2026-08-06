## Exploration: RIOJAMAP Excel Import Feature

### Current State

**Database Architecture (Prisma + PostgreSQL)**
- Currently minimal schema: `User` (auth), `Obra` (basic works tracking)
- `Obra` model has limited fields: fecha, municipio, referente, concepto, tipo, estado, montoTotal, montoParcial
- No support for expediente numbers, person-based tables, or import flags
- No audit trail or import tracking

**Data Flow**
- Manual database input via Express API (POST /api/obras)
- GET endpoints support filtering by municipio and referente (case-insensitive substring match)
- KPIs calculated on-the-fly (sum of montos, pendiente = total - parcial)
- No import pipeline exists yet

---

### Affected Areas
- `server/prisma/schema.prisma` — must add Expediente, Movement, Person, ImportLog tables
- `server/src/routes/obras.ts` — extend to support expediente-based lookups and flagging
- `server/src/schemas/obra.ts` — add validation for new fields
- Database migrations — new tables and indexes for matching logic
- No existing import service — must build from scratch

---

### Master File Analysis: "Informes_Convenios_Deudas (2).xlsx"

**22 Sheets Structure**

1. **Index Sheets** (navigation):
   - `Intendentes` — 28 political figures (e.g., "INT. ARMANDO MOLINA - Capital")
   - `ÍNDICE` — table of contents

2. **Core Data Sheets** (60–78 rows each):
   - **Expedientes** (60 rows)
     - Columns: `Fecha`, `Nùmero de EXPTE` (KEY), `Referente y Solicitante`, `Motivo o Detalle`, `Monto TOTAL`, `Pago PARCIAL`, `SALDO` (formula), `Estado de Convenio`, `Pago TOTAL` (boolean), `Check` (boolean)
     - Expediente format: `H11-01618-7-26` (letter + 2 digits + dash + 5 digits + dash + 1 digit + dash + 2 year digits)
     - Referent examples: "Ricki Herrera Chilecito - DANIEL FLORES", "Ricki Herrera"
     
   - **CONVENIOSMunic** (55 rows)
     - Same structure as Expedientes, but for municipal agreements
     - Some `Pago PARCIAL` values null (amount not yet paid)
     - State: "CONTABLE", "PENDIENTE"
     
   - **DeudasEXPTES** (78 rows)
     - `Nùmero de EXPTE`, `Referente y Solicitante` (format: "FRUTILLA/DANIEL FLORES", "ANDRES SOTO/ FABIAN DE LA FUENTE")
     - No `Fecha` column filled
     - Debts linked to expedientes (mostly unpaid)
     
   - **Comp_Especiales** (58 rows)
     - `Apellido y Nombre` (individual names like "DÍAZ FELIZ DANIEL")
     - `DNI` — personal ID number
     - `Detalle`, `Cantidad de CUOTAS`, `Monto TOTAL`, `Pago PARCIAL`, `Saldo`
     - Special case: payments with individual installment tracking

3. **Person-Specific Tabs** (custom worksheets named after individuals):
   - `PiniHerrera`, `GabiPedrali`, `TeresitaMadera`, `FlorenciaLopez`, `FernandoRejal`, `GuryCaceres`, `Dirigentes`, `Romina`, `Misael`
   - These appear to be person-based tables already segregated by Excel user

4. **Other Sheets** (referenced but not detailed):
   - `Diputados` (10 rows) — deputies
   - Additional reference/lookup sheets

---

### Daily Report Analysis: "INFORME DIARIO- RICARDO HERRERA 20-07-2026 (1).xlsx"

**Single Sheet: "Hoja1"**

- **Dimensions**: 104 rows, 17 columns
- **Header Row 5**: "PAGOS Y TRANSFERENCIAS RE..." (repeated across all 15 cols — likely merged cells)
- **Data Rows 7–104**: Payment/transfer records
- **Sample Columns** (from rows 7–10):
  1. Date: `Sun Jul 19 2026 21:00:00` (ISO datetime)
  2. Code/ID: `14939`
  3. Operation Type: `OP ABIERTA 514`, `01-01`
  4. Reference: `actuación n° 16`
  5. Operator: `RH` (Ricardo Herrera's initials?)
  6. Movement Type: `ACREDITACION INTERBANKING`
  7. Additional flags: `M`, `S`, `TB`
  8. **Person Name** (last column, visible): `MAZA ANGEL EDUARDO`, `VEGA FABRICIO DANIEL`, `LEO ROSANA`, `LOBOS AURORA MARIANA`

- **Issue**: Header row is merged/unclear; exact column mapping needs clarification from user

---

### Matching Strategy Analysis

**Primary Match: Expediente Number**
- Format is consistent: `H11-XXXXX-X-XX` with regex pattern `^H\d{2}-\d{5}-\d-\d{2}$`
- Appears in all three main data sheets (Expedientes, CONVENIOSMunic, DeudasEXPTES)
- Case sensitivity: Mixed case in master file (`H11-` vs `h11-` in CONVENIOSMunic row)
- **Recommendation**: Normalize to uppercase before matching; use exact match, not substring

**Secondary Match: Name (Referente y Solicitante / Apellido y Nombre)**
- **Problem**: Multiple formats observed:
  - "Ricki Herrera Chilecito - DANIEL FLORES" (referent + location + hyphen + beneficiary)
  - "FRUTILLA/DANIEL FLORES" (slash-separated, possibly nickname + name)
  - "DÍAZ FELIZ DANIEL" (surname + first name, caps)
  - "MAZA ANGEL EDUARDO" (from daily report — last name + first name)
- **Complexity**: No consistent format; requires fuzzy matching or normalization
- **Risk**: Same person might appear as "Ricardo Herrera", "Ricki Herrera", "RH", "HERRERA RICARDO"

**Priority Logic**
1. First, try to match expediente number (exact, case-insensitive)
2. If no expediente match, try name match (fuzzy/partial; needs user spec)
3. If both match, prioritize expediente (higher confidence)
4. If multiple matches found, flag for manual review

---

### Proposed Database Structure

#### Option A: Person-Specific Tables (per user's request)
```
tabla_ricardo_herrera
├── id (PK)
├── fecha
├── numero_expediente (FK → Expediente table if exists)
├── apellido_nombre
├── detalle
├── monto_total
├── monto_parcial
├── saldo (computed)
├── is_eventual (boolean) — TRUE if matched by expediente
├── source_import_id (FK → ImportLog)
├── created_at, updated_at

tabla_gury_caceres
├── (same structure)

tabla_misael
├── (same structure)
... etc for each person
```

**Pros**:
- Matches user's intuitive model (person-based tables)
- Easy to query person-specific data
- Aligns with how Excel is already organized

**Cons**:
- Schema explosion (20+ tables for 20+ people)
- Difficult to add new person (requires migration)
- Redundant structure across all person tables
- No global "all movements" query without UNION

---

#### Option B: Single Unified Table with person_id Foreign Key (RECOMMENDED)
```
Movement
├── id (PK)
├── person_id (FK → Person table)
├── fecha
├── numero_expediente (nullable, FK → Expediente if exists)
├── apellido_nombre
├── detalle
├── monto_total
├── monto_parcial
├── saldo (computed)
├── is_eventual (boolean)
├── source_import_id (FK → ImportLog)
├── created_at, updated_at

Person
├── id (PK)
├── name (e.g., "Ricardo Herrera")
├── table_name_alias (e.g., "tabla_ricardo_herrera" — for UI/reporting)
├── created_at

Expediente
├── id (PK)
├── numero (e.g., "H11-01618-7-26")
├── referente
├── detalle
├── monto_total
├── estado
├── created_at

ImportLog
├── id (PK)
├── import_date
├── source_file (e.g., "INFORME DIARIO- RICARDO HERRERA 20-07-2026 (1).xlsx")
├── person_id (if single-person report)
├── rows_processed
├── rows_matched_by_expediente
├── rows_matched_by_name
├── rows_flagged_for_review
├── created_at
```

**Pros**:
- Normalized schema; single source of truth
- Easy to add new people (no migration)
- Cross-person queries trivial (no UNION)
- Audit trail for all imports
- Scalable to hundreds of people

**Cons**:
- Less intuitive than separate tables
- Requires UI/API layer to translate to "tabla_X" concept for users

---

### Flag System Design

**`is_eventual` Boolean Flag**

- **When Set to TRUE**: Movement was matched by expediente number (high confidence)
- **When Set to FALSE**: Movement was matched by name only, or manually created
- **Purpose**: Tag "eventual" payments that arrived via expediente number match

**Alternative Richer Flag**:
```
match_type ENUM
├── 'expediente_exact' — matched H11-* number
├── 'name_fuzzy' — matched by name similarity
├── 'manual' — manually entered
├── 'ambiguous' — multiple matches found; awaiting review
```

**Update Logic on Re-import**:
- Should re-imports overwrite the `is_eventual` flag? (needs clarification)
- Suggested: Add `last_import_date` to track when each row was last updated

---

### Key Ambiguities & Questions for User

1. **Person Table Naming**
   - Should we keep your "tabla_XXX" names? Or use programmatic structure internally?
   - Example: `tabla_ricardo_herrera` vs. Person table with alias field?

2. **Daily Report Headers**
   - Can you clarify the exact column names in the daily report (row 5)?
   - Which columns are "Número de Expediente", "Fecha", "Apellido y Nombre"?

3. **Name Matching Strategy**
   - When a daily report says "MAZA ANGEL EDUARDO", how should we search the master file?
   - Should we try substring matching, fuzzy (Levenshtein), or exact normalization?
   - How close is "close enough" for a name match?

4. **Multi-Person Entries**
   - Some rows have two names (e.g., "Gury Caceres/Sandra Ines Vanni")
   - Should we split these into two rows, or keep as one with a compound person_id?

5. **Import Frequency & Dedupe**
   - How often will daily reports be imported (daily, weekly)?
   - Should we prevent duplicate movements (by date + expediente + monto)?
   - What if same expediente is imported twice with different amounts?

6. **Historical Data**
   - Should we import all 60+ rows from Expedientes sheet first, then overlay daily reports?
   - Or is daily report data separate from the master file?

---

### Recommended Approach

**Phase 1: Schema Design**
- Use Option B (unified Movement table with person_id FK)
- Add Expediente table to index all known expedientes
- Create ImportLog for audit trail
- Add Match rules table for name normalization

**Phase 2: Import Service**
- Build `ImportExcelService` to:
  1. Parse Excel file (Expedientes or daily report)
  2. For each row:
     a. Extract número_expediente, nombre, fecha, monto fields
     b. Try to find matching Expediente by number (exact, case-insensitive)
     c. If no match, try fuzzy name match (need strategy)
     d. Set `is_eventual = true` if expediente matched
     e. Create/update Movement record
  3. Log import event with match statistics

**Phase 3: API Enhancements**
- GET `/api/movements/by-person/{person_id}` — all movements for a person
- GET `/api/movements/by-expediente/{numero}` — all movements for an expediente
- GET `/api/import-logs` — audit trail of all imports
- POST `/api/import` — accept Excel file, run import service

**Phase 4: UI**
- Import dashboard (upload Excel, preview matches)
- Person view (timeline of all their movements)
- Expediente view (all payments/transfers against an expediente)

---

### Risks & Gotchas

1. **Formula Columns in Excel**: SALDO is a formula (not value)
   - Solution: Calculate SALDO = MONTO_TOTAL - MONTO_PARCIAL during import

2. **Case Sensitivity & Normalization**:
   - Expediente: "H11-01618-7-26" vs "h11-01637-6-26"
   - Names: "Ricki Herrera" vs "RICARDO HERRERA"
   - Solution: Normalize to uppercase for matching; store original

3. **Merged Cells in Daily Report**:
   - Header row is merged; may cause parsing issues
   - Solution: Test Excel parsing thoroughly; may need manual header mapping

4. **Multi-Name Ambiguity**:
   - "ANDRES SOTO/ FABIAN DE LA FUENTE" — is this one person or two?
   - Solution: Ask user; may need person-linking table if two people share a record

5. **Null Values**:
   - CONVENIOSMunic.PagoPARCIAL is sometimes null
   - DeudasEXPTES.Fecha is always null
   - Solution: Handle gracefully; interpret null as 0 for monto, use import date for fecha

---

### Ready for Proposal

**Yes**. This exploration has uncovered:
- ✅ Current minimal schema (Obra model only)
- ✅ Master file structure (22 sheets, 3 key data sheets, person-specific tabs)
- ✅ Daily report format (104 rows, 17 columns, person names in last column)
- ✅ Matching strategy (expediente first, name second)
- ✅ Two database schema options (recommend unified + person alias)
- ✅ Import service high-level flow
- ✅ Key risks and gotchas

**Next Phase**: Detailed design spec covering:
1. Full Prisma schema migration
2. Matching algorithm pseudo-code with fuzzy logic
3. Import service architecture
4. API endpoint specifications
5. Test scenarios for edge cases (dupes, ambiguous matches, multi-person entries)

The proposal should confirm the ambiguous points above with the user before spec phase begins.
