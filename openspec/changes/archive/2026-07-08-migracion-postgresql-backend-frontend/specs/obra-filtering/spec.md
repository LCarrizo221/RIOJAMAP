# Spec: Obra Filtering API

## Intent

Enable filtered queries on obras by municipio and referente with case-insensitive matching.

## Requirements

### REQ-1: Filter by Municipio

**GET /api/obras?municipio={name}** SHALL filter obras by department name.

**Matching rules:**
- Case-insensitive comparison
- Exact match required (no partial matching)
- MUST match GeoJSON department names

**Scenarios:**

**Given** obras exist with municipio="Capital"  
**When** GET /api/obras?municipio=Capital  
**Then** return 200 with only Capital obras

**Given** obras exist with municipio="Capital"  
**When** GET /api/obras?municipio=capital  
**Then** return 200 with only Capital obras (case-insensitive)

**Given** no obras with municipio="InvalidDepartment"  
**When** GET /api/obras?municipio=InvalidDepartment  
**Then** return 200 with empty data array

---

### REQ-2: Filter by Referente

**GET /api/obras?referente={name}** SHALL filter obras by responsable person.

**Matching rules:**
- Case-insensitive comparison
- Partial match allowed (contains search)

**Scenarios:**

**Given** obras exist with referente="Carlos Pérez"  
**When** GET /api/obras?referente=carlos  
**Then** return 200 with obras where referente contains "carlos"

**Given** obras exist with referente="Carlos Pérez"  
**When** GET /api/obras?referente=PÉREZ  
**Then** return 200 with matching obras (case-insensitive)

---

### REQ-3: Combined Filters

**GET /api/obras?municipio={name}&referente={name}** SHALL apply both filters with AND logic.

**Scenarios:**

**Given** obras exist with municipio="Capital" AND referente="Carlos"  
**When** GET /api/obras?municipio=Capital&referente=Carlos  
**Then** return 200 with obras matching BOTH criteria

**Given** obras exist with municipio="Capital" but none with referente="Carlos" in Capital  
**When** GET /api/obras?municipio=Capital&referente=Carlos  
**Then** return 200 with empty data array

**Given** no filter params provided  
**When** GET /api/obras  
**Then** return 200 with all obras (no filtering applied)

---

### REQ-4: Filter with Pagination

Filters MUST work together with pagination params.

**Scenarios:**

**Given** 15 obras with municipio="Capital"  
**When** GET /api/obras?municipio=Capital&page=1&limit=10  
**Then** return 200 with first 10 Capital obras and pagination.total=15

---

## Constraints

- Municipio filter: exact match only (case-insensitive)
- Referente filter: partial match allowed (case-insensitive)
- Empty result set MUST return 200 with empty array, NOT 404
- Filter params are OPTIONAL; omitting them returns all records

## Out of Scope

- Date range filtering
- Tipo or estado filtering
- Amount range filtering
- Sorting options
