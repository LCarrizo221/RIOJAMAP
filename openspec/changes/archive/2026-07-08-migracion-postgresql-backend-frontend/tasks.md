# Tasks: Migración PostgreSQL Backend + Frontend

## Review Workload Forecast

**Estimated changed lines**: ~1800-2200 lines

**Breakdown**:
- Backend files (new): ~600 lines (8 files: schema, seed, routes, controller, service, validation, types, index)
- Frontend files (modified): ~800 lines (6 files: App, Map, Dashboard, types, api client, validation)
- Frontend files (new): ~400 lines (3 files: ObraTable, ObraModal, KpiCards)
- Configuration files: ~200 lines (package.json root, server package.json, client package.json, docker-compose, .env, tsconfig files)
- Seed data: 44 records (~100 lines)

**Chained PR Recommendation**: YES — This change exceeds the 400-line review budget. Recommend splitting into 3 chained PRs:

1. **PR #1: Backend Foundation** (~700 lines) — Database schema, seed, Express API, Prisma setup
2. **PR #2: Frontend Core** (~700 lines) — Types, API client, Dashboard integration, KPI display
3. **PR #3: CRUD UI** (~500 lines) — ObraModal, ObraTable, create/edit/delete functionality

Each PR builds on the previous one and can be reviewed independently.

---

## Phase 0: Project Setup & Infrastructure

**Goal**: Establish monorepo structure, install dependencies, configure PostgreSQL in Docker.

### Task 0.1: Create Project Structure
**Files**: Root directories, package.json files
- Create `server/` directory with `src/`, `prisma/` subdirectories
- Create `client/` directory (copy from `/tmp/riojamap-eval/`)
- Create root `package.json` with workspaces or scripts for concurrent dev
- Create `docker-compose.yml` with PostgreSQL service
- Create `.env` with `DATABASE_URL`, `PORT=3001`

**Verification**:
```bash
ls -la server/ client/ docker-compose.yml .env
```

### Task 0.2: Install Backend Dependencies
**Files**: `server/package.json`
- Initialize `server/package.json`
- Install: `express`, `dotenv`, `prisma`, `@prisma/client`, `zod`, `cors`
- Install dev: `tsx`, `@types/express`, `@types/cors`, `@types/node`

**Verification**:
```bash
cd server && npm install && ls node_modules/@prisma
```

### Task 0.3: Install Frontend Dependencies
**Files**: `client/package.json`
- Copy `/tmp/riojamap-eval/package.json` to `client/package.json`
- **Remove**: `@google/genai`, `react-simple-maps`, `d3-geo`, `d3-scale`, `express`, `dotenv`, `autoprefixer`
- **Remove dev**: `@types/d3-geo`, `@types/d3-scale`, `@types/react-simple-maps`
- **Add**: `zod` (for frontend validation)
- Run `npm install` in client/

**Verification**:
```bash
cd client && npm install && grep -E "(genai|d3-geo|react-simple-maps)" package.json
# Should return nothing
```

### Task 0.4: Configure Docker PostgreSQL
**Files**: `docker-compose.yml`, `.env`, `server/.env`
- Create `docker-compose.yml` with PostgreSQL 15+ service
- Set env vars: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB=riojamap`
- Expose port 5432
- Create `.env` at root with `DATABASE_URL="postgresql://user:pass@localhost:5432/riojamap"`
- Create `server/.env` (or symlink from root)

**Verification**:
```bash
docker-compose up -d && docker ps | grep postgres
```

---

## Phase 1: Backend Implementation

**Goal**: Build Express REST API with Prisma ORM, complete CRUD + filtering + KPIs.

### Task 1.1: Define Prisma Schema
**Files**: `server/prisma/schema.prisma`
- Initialize Prisma: `npx prisma init`
- Define `Obra` model with 11 fields:
  - `id`, `fecha`, `municipio`, `referente`, `concepto`, `tipo`, `estado`, `montoTotal`, `montoParcial`, `createdAt`, `updatedAt`
- Use `Float` for monetary fields, `DateTime` for dates
- Define enums for `tipo` (12 values) and `estado` (5 values)

**Verification**:
```bash
cd server && npx prisma validate
```

### Task 1.2: Create Seed Script with 44 Records
**Files**: `server/prisma/seed.ts`, `server/prisma/seed-data.json`
- Create `seed-data.json` with 44 obra records (user-provided data)
- Validate municipio names against `la_rioja.json` departments before insert
- Implement `seed.ts` using `createMany()`
- Add validation: throw error if any municipio doesn't match GeoJSON

**Verification**:
```bash
cd server && npx tsx prisma/seed.ts
# Should complete without errors, 44 records inserted
```

### Task 1.3: Run Prisma Migration
**Files**: `server/prisma/migrations/`
- Run: `npx prisma migrate dev --name init_obras`
- Run: `npx prisma generate`
- Verify migration file created

**Verification**:
```bash
ls server/prisma/migrations/ && npx prisma db seed
```

### Task 1.4: Create Zod Validation Schemas
**Files**: `server/validation/obra.schema.ts`
- Create `obraInputSchema` for POST/PUT payloads
- Validate: fecha (ISO date), municipio (non-empty), referente (non-empty), concepto (non-empty)
- Validate enums: tipo (12 values), estado (5 values)
- Validate amounts: montoTotal >= 0, montoParcial >= 0, montoParcial <= montoTotal
- **Exclude** `montoPendiente` from input schema (computed field)
- Export types inferred from schema

**Verification**:
```bash
cd server && npx tsx -e "import { obraInputSchema } from './validation/obra.schema'; console.log(obraInputSchema.parse({ ...valid data }))"
```

### Task 1.5: Create Express Type Extensions
**Files**: `server/types/express.d.ts`
- Extend Express `Request` type to include typed params/queries if needed

**Verification**: TypeScript compiles without errors.

### Task 1.6: Implement Service Layer
**Files**: `server/services/obras.service.ts`
- Implement functions:
  - `getAll(filters, pagination)` — case-insensitive municipio (exact), referente (partial)
  - `getById(id)` — throw 404 if not found
  - `create(data)` — return created record
  - `update(id, data)` — throw 404 if not found
  - `delete(id)` — throw 404 if not found
  - `getKpis(filters)` — return { total, parcial, pendiente, count }
- Compute `montoPendiente` in service layer before return

**Verification**: Unit test service functions manually or via tsx REPL.

### Task 1.7: Implement Controller Layer
**Files**: `server/controllers/obras.controller.ts`
- Implement handlers:
  - `listObras` — GET /api/obras with pagination + filters
  - `getObraById` — GET /api/obras/:id
  - `createObra` — POST /api/obras
  - `updateObra` — PUT /api/obras/:id
  - `deleteObra` — DELETE /api/obras/:id
  - `getKpis` — GET /api/obras/kpis
- Handle errors: 400 (validation), 404 (not found), 500 (server error)
- Return consistent error shape: `{ error: string, code?: string }`

**Verification**: Manual curl tests against running server.

### Task 1.8: Implement Routes
**Files**: `server/routes/obras.routes.ts`
- Define Express Router with all endpoints
- Wire controller handlers
- Export router

**Verification**: Routes registered in Express app.

### Task 1.9: Create Express Entry Point
**Files**: `server/index.ts`, `server/tsconfig.json`
- Create Express app with CORS enabled
- Mount routes: `/api/obras`
- Configure JSON parsing middleware
- Set port from env (default 3001)
- Add health check endpoint: `GET /health`

**Verification**:
```bash
cd server && npx tsx index.ts
curl http://localhost:3001/health
```

### Task 1.10: Configure Root Package Scripts
**Files**: `package.json` (root)
- Add scripts:
  - `dev`: run server and client concurrently
  - `build`: build client, then server
  - `db:migrate`: run Prisma migrations
  - `db:seed`: run seed script

**Verification**:
```bash
npm run dev
```

---

## Phase 2: Frontend Core Integration

**Goal**: Adapt frontend to consume real API, replace mock data with live data.

### Task 2.1: Define TypeScript Types
**Files**: `client/src/types/obra.types.ts`
- Create `Obra` interface matching backend response
- Create `ObraTipo` and `ObraEstado` type unions (12 tipos, 5 estados)
- Create `ObrasListResponse` with pagination
- Create `ObrasKpisResponse`
- **Remove** census-related types from `types.ts`

**Verification**: TypeScript compiles without errors.

### Task 2.2: Create API Client
**Files**: `client/src/api/obras.api.ts`
- Implement functions:
  - `getObras(filters?)` — returns `Promise<ObrasListResponse>`
  - `getObraById(id)` — returns `Promise<Obra>`
  - `createObra(data)` — returns `Promise<Obra>`
  - `updateObra(id, data)` — returns `Promise<Obra>`
  - `deleteObra(id)` — returns `Promise<void>`
  - `getKpis(filters?)` — returns `Promise<ObrasKpisResponse>`
- Handle errors with try/catch, throw descriptive errors
- Use environment variable for API base URL (Vite proxy in dev)

**Verification**: Manual test via browser console or test component.

### Task 2.3: Create Frontend Validation Schemas
**Files**: `client/src/validation/obra.schema.ts`
- Mirror backend `obraInputSchema` exactly
- Add comment with last-sync date
- Export form validation helper function

**Verification**: Form validation works for valid/invalid inputs.

### Task 2.4: Adapt App.tsx Layout
**Files**: `client/src/App.tsx`
- Replace `DepartmentProps` state with `Obra | null` for selectedDept
- Remove census-related state (totalPoblacion, totalHogares)
- Add state for API loading/error states
- Keep header/footer structure
- Pass selectedDept to Dashboard component

**Verification**: App renders without TypeScript errors.

### Task 2.5: Adapt Map Component for API Integration
**Files**: `client/src/components/Map.tsx`
- Keep all Leaflet/GeoJSON logic intact
- Ensure `onClick` passes `DepartmentProps` with correct `departamento` name
- Verify GeoJSON department names match database municipio values
- **No API calls in Map component** — just pass selected department up

**Verification**: Click on map triggers parent state update.

### Task 2.6: Rewrite Dashboard Component
**Files**: `client/src/components/Dashboard.tsx`
- **Remove** all mock financial data (OBRAS_MOCK, financialData)
- Add state: `obras`, `kpis`, `loading`, `error`, `selectedReferente`
- Implement `useEffect` that calls API when `selectedDept` changes:
  - Call `getObras({ municipio: selectedDept.departamento })`
  - Call `getKpis({ municipio: selectedDept.departamento })`
- Extract unique referentes from obras data for dropdown
- Implement referente filter: re-fetch with combined filters
- Display KPI cards with real data (format as ARS currency)
- Add loading spinner and error state UI
- Add "Nueva Obra" button (opens modal)

**Verification**:
1. Click on map department → Dashboard shows real KPIs
2. Select referente from dropdown → KPIs and data update
3. Loading state shows during fetch
4. Error state shows on API failure

### Task 2.7: Create KpiCards Component
**Files**: `client/src/components/KpiCards.tsx`
- Create reusable component with 3 cards: Total, Parcial, Pendiente
- Accept `kpis` prop with { total, parcial, pendiente, count }
- Format amounts as ARS currency
- Show "---" or disabled state when no data
- Add count badge showing number of obras

**Verification**: Component renders correctly with mock and real data.

### Task 2.8: Copy GeoJSON Data
**Files**: `client/src/data/la_rioja.json`
- Copy from `/tmp/riojamap-eval/src/data/la_rioja.json`
- Verify file is accessible via import

**Verification**:
```bash
ls client/src/data/la_rioja.json
```

---

## Phase 3: CRUD UI Implementation

**Goal**: Add create, edit, delete functionality with modal forms and data table.

### Task 3.1: Create ObraTable Component
**Files**: `client/src/components/ObraTable.tsx`
- Display filtered obras in table format
- Columns: concepto, estado (badge), montoTotal (currency), acciones (edit/delete buttons)
- Implement estado badge colors:
  - En Ejecución: orange
  - Finalizado: green
  - Pendiente: gray
  - Proyectada: blue
  - Detenida: red
- Handle empty state: "No hay obras para este filtro"
- Add edit button: opens modal with pre-filled data
- Add delete button: shows confirmation, then calls API

**Verification**: Table displays obras correctly, actions work.

### Task 3.2: Create ObraModal Component
**Files**: `client/src/components/ObraModal.tsx`
- Modal form for create/edit operations
- Fields: fecha (date picker), municipio (dropdown), referente (text), concepto (text), tipo (select), estado (select), montoTotal (number), montoParcial (number)
- Frontend validation using Zod schema
- Validate montoParcial <= montoTotal before submit
- Show inline error messages
- On submit: call `createObra` or `updateObra`, close modal, refresh parent data
- Pre-fill form in edit mode

**Verification**:
1. Create new obra → appears in table after refresh
2. Edit existing obra → changes persist
3. Validation errors show for invalid inputs
4. montoParcial > montoTotal blocks submission

### Task 3.3: Wire Modal to Dashboard
**Files**: `client/src/components/Dashboard.tsx`
- Add state: `modalOpen`, `editingObra`
- "Nueva Obra" button opens modal in create mode
- Edit button in table opens modal in edit mode with selected obra
- On modal close/submit: refresh obras and KPIs

**Verification**: Full CRUD flow works end-to-end.

### Task 3.4: Add Loading and Error States
**Files**: All components making API calls
- Add loading spinners during API calls
- Add error toast or banner for API failures
- Handle edge cases: network error, 404, validation error

**Verification**: Simulate API failure → UI shows error state.

---

## Phase 4: Integration Testing & Polish

**Goal**: Verify end-to-end functionality, fix bugs, ensure data consistency.

### Task 4.1: Test Map Click → API → UI Flow
**Scenario**: User clicks "CAPITAL" on map
- Verify API call: `GET /api/obras?municipio=CAPITAL`
- Verify KPIs update with correct sums
- Verify table shows only Capital obras
- Verify referente dropdown populates with unique referentes from Capital

**Verification**: Manual E2E test in browser.

### Task 4.2: Test Filter Combination
**Scenario**: User selects municipio, then referente
- Verify API call includes both params
- Verify KPIs reflect combined filter
- Verify table shows filtered results
- Verify "Todos" option clears referente filter

**Verification**: Multiple filter combinations tested.

### Task 4.3: Test CRUD Operations
**Scenarios**:
- Create obra → appears in table immediately
- Edit obra → changes persist after refresh
- Delete obra → removed from table, KPIs recalculate
- Validation errors block invalid submissions

**Verification**: All CRUD operations work correctly.

### Task 4.4: Test KPI Consistency
**Verification**:
- `pendiente` always equals `total - parcial`
- Empty filter returns zeros, not 404
- KPIs match manual sum of table data

### Task 4.5: Verify Dependency Cleanup
**Files**: `client/package.json`
- Confirm removed: `@google/genai`, `d3-geo`, `d3-scale`, `react-simple-maps`, `autoprefixer`
- Confirm kept: `react-leaflet`, `recharts`, `motion`, `lucide-react`

**Verification**:
```bash
cd client && grep -E "(genai|d3-geo|react-simple-maps)" package.json
# Should return nothing
```

### Task 4.6: Verify Seed Data Integrity
**Verification**:
- All 44 records seeded successfully
- Municipio names match GeoJSON exactly
- No duplicate IDs
- Amounts are non-negative

**Verification**:
```bash
cd server && npx prisma db seed && npx prisma studio
```

---

## Success Criteria (from Proposal)

- [ ] API responde CRUD completo para /obras
- [ ] Filtro por municipio retorna obras correctas
- [ ] Filtro por referente dentro de municipio funciona
- [ ] KPIs (total, parcial, pendiente) calculan sums correctos
- [ ] Frontend muestra datos reales al hacer click en departamento
- [ ] 0 dependencias de @google/genai, d3-geo, d3-scale
- [ ] PostgreSQL corre en Docker, Prisma conecta exitosamente
- [ ] 44 records seedeados en database

---

## Dependencies Between Phases

```
Phase 0 (Setup) → Phase 1 (Backend) → Phase 2 (Frontend Core) → Phase 3 (CRUD UI) → Phase 4 (E2E)
```

**Critical path**:
- Backend API (Phase 1) must be ready before Frontend can integrate (Phase 2)
- Frontend types/API client (Phase 2) must exist before CRUD UI (Phase 3)
- All features must be implemented before E2E testing (Phase 4)

**Parallel work possible**:
- Task 0.2 (backend deps) and Task 0.3 (frontend deps) can run in parallel
- Task 2.1 (types) and Task 2.2 (API client) can start once backend schema is stable
- Task 3.1 (table) and Task 3.2 (modal) can be developed in parallel
