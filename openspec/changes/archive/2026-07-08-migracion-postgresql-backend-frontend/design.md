# Design: Migración PostgreSQL Backend + Frontend

## Technical Approach

Build a **monolithic TypeScript project** with `/server` and `/client` directories. This avoids workspace complexity while maintaining clear separation of concerns. The backend serves both API endpoints and static frontend files in production.

**Key principle**: Backend is the source of truth. Frontend replicates Zod validation for UX, but all data integrity is enforced server-side.

---

## Architecture Decisions

### 1. Monolith over Monorepo
**Decision**: Single project with `/server` and `/client` subdirectories.

**Why**:
- Simpler dependency management (one `package.json` root)
- Shared types via imports (no sync needed)
- Single Docker container for deployment
- Vite handles frontend build, Express serves API + static files

**Tradeoff**: Less modular than workspaces, but 44 records don't need microservices.

### 2. API Design: REST with Query Params
**Pattern**:
- `GET /api/obras` — list with `?municipio=&referente=&page=&limit=`
- `GET /api/obras/kpis` — aggregated totals with same filters
- `GET /api/obras/:id` — single record
- `POST/PUT/DELETE /api/obras[:id]` — CRUD

**Error handling**:
- 400: Validation errors (Zod)
- 404: Resource not found
- 500: Database errors (generic message, log details)
- All errors return `{ error: string, code?: string }`

### 3. Validation Strategy
**Backend**: Zod schemas in `server/validation/obra.schema.ts`
**Frontend**: Duplicate schemas in `client/src/validation/obra.schema.ts`

**Why duplicate**: Frontend needs instant feedback without API roundtrip. Backend re-validates for security.

**Sync mechanism**: Manual — if backend schema changes, frontend MUST match. Add comment with last-sync date.

### 4. `montoPendiente` Computation
**Rule**: NEVER accept `montoPendiente` as input. ALWAYS compute as `montoTotal - montoParcial`.

**Backend**: Prisma `computed` field or calculate in service layer before return.
**Frontend**: Display only, never include in POST/PUT payloads.

---

## Data Flow: Map Click → KPI Update

```
1. User clicks "Capital" department on Leaflet map
   ↓
2. Map.tsx calls onClick(department) with { departamento: "CAPITAL", ... }
   ↓
3. Dashboard component receives selectedDept
   ↓
4. Dashboard calls API: GET /api/obras?municipio=CAPITAL
   ↓
5. Backend controller:
   - Extracts municipio param
   - Calls service: obras.getByFilters({ municipio: "CAPITAL" })
   - Prisma: where: { municipio: { equals: "CAPITAL", mode: "insensitive" } }
   ↓
6. Backend returns: { data: [...], pagination: {...} }
   ↓
7. Frontend updates:
   - KPI cards: sum(montoTotal), sum(montoParcial), sum(montoPendiente)
   - Referente dropdown: extract unique referentes from data
   - Table: render rows
   ↓
8. User selects referente "Carlos" from dropdown
   ↓
9. Repeat from step 4 with: GET /api/obras?municipio=CAPITAL&referente=carlos
```

**State management**: React `useState` + `useEffect`. No Redux needed for this scope.

---

## File Structure

```
RIOJAMAP/
├── server/
│   ├── index.ts                 # Express entry point
│   ├── routes/
│   │   └── obras.routes.ts      # API route definitions
│   ├── controllers/
│   │   └── obras.controller.ts  # Request handlers
│   ├── services/
│   │   └── obras.service.ts     # Business logic + Prisma calls
│   ├── validation/
│   │   └── obra.schema.ts       # Zod schemas
│   ├── prisma/
│   │   ├── schema.prisma        # Data model
│   │   └── seed.ts              # 44 records seed script
│   └── types/
│       └── express.d.ts         # Express type extensions
│
├── client/
│   ├── src/
│   │   ├── App.tsx              # Main layout (copy from /tmp/riojamap-eval)
│   │   ├── main.tsx             # React entry
│   │   ├── components/
│   │   │   ├── Map.tsx          # Leaflet map (adapt for API calls)
│   │   │   ├── Dashboard.tsx    # KPIs + table (replace mock with API)
│   │   │   ├── Sidebar.tsx      # Hover sidebar (keep as-is)
│   │   │   └── ObraModal.tsx    # NEW: Create/Edit form
│   │   ├── api/
│   │   │   └── obras.api.ts     # NEW: API client functions
│   │   ├── validation/
│   │   │   └── obra.schema.ts   # Zod schemas (mirror backend)
│   │   ├── types/
│   │   │   └── obra.types.ts    # NEW: TypeScript interfaces
│   │   └── data/
│   │       └── la_rioja.json    # Copy from /tmp/riojamap-eval
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── package.json                 # Root: scripts for dev, build
├── docker-compose.yml           # PostgreSQL service
└── .env                         # DATABASE_URL, PORT
```

---

## Interfaces / Contracts

### Shared Type: Obra
```typescript
// Both server/client use this shape
interface Obra {
  id: number
  fecha: string              // ISO date
  municipio: string          // Must match GeoJSON department names
  referente: string
  concepto: string
  tipo: ObraTipo
  estado: ObraEstado
  montoTotal: number
  montoParcial: number
  montoPendiente: number     // Computed
  createdAt: string
  updatedAt: string
}

type ObraTipo = 'Infraestructura' | 'Salud' | 'Educación' | 'Social' | 
                'Deporte' | 'Energía' | 'Turismo' | 'Tecnología' | 
                'Productivo' | 'Subsidio' | 'Cultura' | 'Maquinaria'

type ObraEstado = 'En Ejecución' | 'Finalizado' | 'Pendiente' | 
                  'Proyectada' | 'Detenida'
```

### API Response Shapes
```typescript
// GET /api/obras
interface ObrasListResponse {
  data: Obra[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// GET /api/obras/kpis
interface ObrasKpisResponse {
  total: number
  parcial: number
  pendiente: number
  count: number
}
```

### Zod Schema (Backend + Frontend)
```typescript
const obraInputSchema = z.object({
  fecha: z.string().datetime(),
  municipio: z.string().min(1),
  referente: z.string().min(1),
  concepto: z.string().min(1),
  tipo: z.enum([...12 tipos]),
  estado: z.enum([...5 estados]),
  montoTotal: z.number().min(0),
  montoParcial: z.number().min(0),
}).refine(d => d.montoParcial <= d.montoTotal, {
  message: "montoParcial no puede superar montoTotal",
  path: ["montoParcial"]
})
```

---

## Migration / Rollout

### 1. Database Setup
```bash
# Start PostgreSQL
docker-compose up -d

# Install Prisma, run migration
cd server
npx prisma migrate dev --name init_obras
npx prisma generate
```

### 2. Seed 44 Records
**Source**: User-provided data (TBD format).

**Script**: `server/prisma/seed.ts`
- Parse data from JSON/CSV
- Validate municipio names against `la_rioja.json` departments
- Insert via Prisma `createMany()`

**Validation step**:
```typescript
const geoJsonDepts = laRiojaData.features.map(f => f.properties.departamento)
const invalidMunicipios = seedData.filter(d => !geoJsonDepts.includes(d.municipio))
if (invalidMunicipios.length > 0) throw new Error(`Invalid municipios: ${invalidMunicipios.join(', ')}`)
```

### 3. Frontend Adaptation
**Phase 1**: Copy `/tmp/riojamap-eval` to `client/`, remove dependencies
**Phase 2**: Replace `DepartmentProps` with `Obra` types
**Phase 3**: Implement API client in `client/src/api/obras.api.ts`
**Phase 4**: Wire Dashboard to real data
**Phase 5**: Add ObraModal for CRUD

---

## Open Questions

1. **Seed data format**: User needs to provide 44 records. What format? (JSON, CSV, Google Sheet export?)

2. **Municipio name normalization**: GeoJSON uses uppercase ("CAPITAL"), but user may input "Capital". Should we:
   - Normalize all to uppercase in database?
   - Store as-provided and use case-insensitive queries?
   - **Recommendation**: Store as-provided, use Prisma `mode: "insensitive"` for matching.

3. **File uploads**: Any need to attach documents (PDFs, images) to obras? **Out of scope for now**, but schema should allow future `documentoUrl` field.

4. **Port configuration**: Backend default 3001, frontend dev server 3000? Or proxy via Vite config?
   - **Recommendation**: Vite proxy `/api` → `http://localhost:3001` in dev. Production: Express serves both.

---

## Dependencies

### Keep (from APP 1)
**Frontend**: `react`, `react-dom`, `leaflet`, `react-leaflet`, `recharts`, `lucide-react`, `motion`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `tailwindcss`, `typescript`, `vite`

**Backend**: `express`, `dotenv`

### Add
**Backend**: `prisma`, `@prisma/client`, `zod`, `cors`, `tsx` (dev)

### Remove
`@google/genai`, `react-simple-maps`, `d3-geo`, `d3-scale`, `autoprefixer`

---

## Success Metrics (from Proposal)

- ✅ API CRUD endpoints respond correctly
- ✅ Municipio/referente filters return correct subsets
- ✅ KPIs calculate accurate sums
- ✅ Frontend displays real data on map click
- ✅ Zero removed dependencies
- ✅ PostgreSQL runs in Docker, Prisma connects
- ✅ 44 records seeded with validated municipio names
