# Spec: Obra CRUD API

## Intent

Provide REST API endpoints for full CRUD operations on Obra entities with Zod validation.

## Requirements

### REQ-1: Create Obra

**POST /api/obras** SHALL create a new obra record.

**Validation:**
- `fecha`: ISO date string (required)
- `municipio`: String matching GeoJSON department names (required)
- `referente`: String, non-empty (required)
- `concepto`: String, non-empty (required)
- `tipo`: Enum [Infraestructura, Salud, Educación, Social, Deporte, Energía, Turismo, Tecnología, Productivo, Subsidio, Cultura, Maquinaria] (required)
- `estado`: Enum [En Ejecución, Finalizado, Pendiente, Proyectada, Detenida] (required)
- `montoTotal`: Decimal >= 0 (required)
- `montoParcial`: Decimal >= 0, MUST be <= montoTotal (required)
- `montoPendiente`: Computed field (montoTotal - montoParcial), ignored on input

**Scenarios:**

**Given** valid obra data with all required fields  
**When** POST /api/obras with valid payload  
**Then** return 201 with created obra including auto-generated id

**Given** payload with montoParcial > montoTotal  
**When** POST /api/obras  
**Then** return 400 with validation error

**Given** payload with invalid tipo or estado value  
**When** POST /api/obras  
**Then** return 400 with enum validation error

---

### REQ-2: Read Obra by ID

**GET /api/obras/:id** SHALL return a single obra.

**Scenarios:**

**Given** obra with id=5 exists  
**When** GET /api/obras/5  
**Then** return 200 with obra object

**Given** no obra with id=999  
**When** GET /api/obras/999  
**Then** return 404

---

### REQ-3: List Obras with Pagination

**GET /api/obras** SHALL return paginated list of all obras.

**Query params:**
- `page`: Integer >= 1 (default: 1)
- `limit`: Integer 1-100 (default: 20)

**Response shape:**
```json
{
  "data": [Obra[]],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

**Scenarios:**

**Given** 44 obras in database  
**When** GET /api/obras?page=1&limit=10  
**Then** return 200 with first 10 obras and pagination.total=44

**Given** invalid page=0  
**When** GET /api/obras?page=0  
**Then** return 400 with validation error

---

### REQ-4: Update Obra

**PUT /api/obras/:id** SHALL update an existing obra.

**Scenarios:**

**Given** obra with id=5 exists  
**When** PUT /api/obras/5 with valid updated data  
**Then** return 200 with updated obra

**Given** no obra with id=999  
**When** PUT /api/obras/999  
**Then** return 404

**Given** update with montoParcial > montoTotal  
**When** PUT /api/obras/:id  
**Then** return 400 with validation error

---

### REQ-5: Delete Obra

**DELETE /api/obras/:id** SHALL remove an obra record.

**Scenarios:**

**Given** obra with id=5 exists  
**When** DELETE /api/obras/5  
**Then** return 204 No Content

**Given** no obra with id=999  
**When** DELETE /api/obras/999  
**Then** return 404

---

## Constraints

- All monetary values MUST be validated as non-negative decimals
- Enum values MUST match exactly (case-sensitive)
- `montoPendiente` is ALWAYS computed, never accepted as input
- Pagination MUST include total count for client-side page calculation

## Out of Scope

- Batch operations
- Soft delete
- Audit logging
- Authentication/authorization
