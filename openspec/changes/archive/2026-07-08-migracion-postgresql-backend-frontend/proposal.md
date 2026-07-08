# Proposal: Migración PostgreSQL Backend + Frontend

## Intent

Reemplazar mock data y Google Sheets con backend real (Express + Prisma + PostgreSQL) para tracking de obras/pagos. Migrar lógica de negocio desde APP 2 (Sheets) a API REST, adaptando frontend APP 1 para consumir endpoints reales.

## Scope

### In Scope
- Prisma schema para modelo Obra (11 campos, 44 records seed)
- Express REST API con CRUD completo + endpoints filtrados (municipio, referente)
- Zod validation schemas para requests/responses
- PostgreSQL en Docker (WSL)
- Copia frontend APP 1 (/tmp/riojamap-eval), limpieza de dependencias
- Adaptación frontend: reemplazar mock data con llamadas API reales
- Tipos: eliminar census data, usar obra/pago types
- GeoJSON local: la_rioja.json para polígonos departamentales

### Out of Scope
- Autenticación/autorización
- Migración histórica automatizada
- Tests (fase posterior)
- CI/CD pipeline
- Datos censales/demográficos
- Deploy a producción

## Capabilities

### New Capabilities
- `obra-crud-api`: CRUD REST endpoints para entidades Obra
- `obra-filtering`: Filtrado por municipio/referente + agregación KPIs
- `postgresql-persistence`: Persistencia PostgreSQL vía Prisma ORM
- `frontend-api-integration`: Frontend consume API real en lugar de mock data

### Modified Capabilities
None

## Approach

1. Setup Prisma + PostgreSQL (Docker)
2. Definir modelo Obra en schema.prisma
3. Seed database con 44 records del usuario
4. Express API server: CRUD + filtros + KPIs
5. Prisma migrate + generate
6. Copiar frontend APP 1, limpiar dependencias, reinstall
7. Adaptar frontend: tipos, API calls, eliminar mock data
8. Verify E2E: click mapa → API → KPIs + tabla filtrada

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/` | New | Express server, Prisma schema, API routes |
| `src/types/` | Modified | Reemplazar census types con obra/pago types |
| `src/api/` | New | API client para llamadas backend |
| `src/components/` | Modified | Adaptar componentes para consumir API |
| `package.json` | Modified | Remover: @google/genai, d3-geo, d3-scale, tsx; Mantener: react-leaflet, recharts, motion |
| `src/data/` | Modified | Usar la_rioja.json local, eliminar mock data |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| GeoJSON nombres no matchean municipios | Medium | Validar nombres contra la_rioja.json antes de desarrollo |
| Prisma migration conflicts | Low | Usar nombres descriptivos, revisar migrations antes de commit |
| Frontend break por tipos cambiados | Medium | TypeScript estricto, fix types antes de adaptar API calls |
| Docker PostgreSQL no disponible en WSL | Low | Documentar setup, proveer docker-compose.yml |

## Rollback Plan

1. Revertir commit que introduce backend/
2. Restaurar package.json anterior (dependencias mock)
3. Restaurar src/data/ con mock data original
4. Eliminar docker-compose.yml si existe
5. Frontend vuelve a usar mock data embebida

## Dependencies

- Docker Desktop con WSL2 habilitado
- Node.js 20+ instalado
- 44 records de obras en formato estructurado (provisto por usuario)

## Success Criteria

- [ ] API responde CRUD completo para /obras
- [ ] Filtro por municipio retorna obras correctas
- [ ] Filtro por referente dentro de municipio funciona
- [ ] KPIs (total, parcial, pendiente) calculan sums correctos
- [ ] Frontend muestra datos reales al hacer click en departamento
- [ ] 0 dependencias de @google/genai, d3-geo, d3-scale
- [ ] PostgreSQL corre en Docker, Prisma conecta exitosamente
- [ ] 44 records seedeados en database
