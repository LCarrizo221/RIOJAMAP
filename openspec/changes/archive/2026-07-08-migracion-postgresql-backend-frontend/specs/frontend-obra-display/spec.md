# Spec: Frontend Obra Display

## Intent

Display obras data on map with interactive filtering, KPI cards, and data table.

## Requirements

### REQ-1: Map Interaction

**Click on department polygon** SHALL trigger API call with municipio filter.

**Scenarios:**

**Given** user clicks "Capital" department on map  
**When** click event occurs  
**Then** call GET /api/obras?municipio=Capital and update UI

**Given** no department selected  
**When** page loads  
**Then** display message "Seleccioná un departamento" with no API call

---

### REQ-2: Referente Dropdown

**Dropdown** SHALL populate with unique referentes from current filtered data.

**Scenarios:**

**Given** Capital selected with 10 obras and 4 unique referentes  
**When** filter applied  
**Then** dropdown shows 4 referente options

**Given** referente selected from dropdown  
**When** selection changes  
**Then** re-fetch with combined filter: ?municipio=X&referente=Y

**Given** "Todos" option selected  
**When** selection changes  
**Then** re-fetch with municipio filter only (no referente filter)

---

### REQ-3: KPI Cards Display

**Three KPI cards** SHALL display total, parcial, pendiente amounts.

**Update behavior:**
- MUST update on every filter change
- MUST format as currency (ARS)
- MUST show count of obras

**Scenarios:**

**Given** Capital selected with 10 obras  
**When** API response received  
**Then** display 3 cards with formatted amounts and count=10

**Given** no department selected  
**When** page loads  
**Then** show placeholder state "---" or disabled cards

---

### REQ-4: Obras Table

**Table** SHALL display filtered obras with actions.

**Columns:**
- concepto (text)
- estado (badge with color coding)
- montoTotal (currency)
- acciones (edit/delete buttons)

**Estado badge colors:**
- En Ejecución: orange/yellow
- Finalizado: green
- Pendiente: gray
- Proyectada: blue
- Detenida: red

**Scenarios:**

**Given** 10 filtered obras  
**When** data loaded  
**Then** table shows 10 rows with correct columns

**Given** empty filter result  
**When** API returns empty array  
**Then** show empty state: "No hay obras para este filtro"

**Given** user clicks edit button  
**When** click occurs  
**Then** open modal form with pre-filled data

**Given** user clicks delete button  
**When** click occurs  
**Then** show confirmation, then call DELETE /api/obras/:id

---

### REQ-5: Create/Edit Modal Form

**Modal form** SHALL handle create and update operations.

**Validation (frontend):**
- All required fields MUST be validated before submit
- montoParcial MUST be <= montoTotal
- Show inline error messages

**Scenarios:**

**Given** user clicks "Nueva Obra" button  
**When** modal opens  
**Then** show empty form with all required fields

**Given** form filled with valid data  
**When** submit clicked  
**Then** call POST /api/obras, close modal, refresh data

**Given** montoParcial > montoTotal  
**When** submit clicked  
**Then** show validation error, block submission

**Given** edit mode with existing obra  
**When** modal opens  
**Then** pre-fill all fields with current values

---

### REQ-6: Empty States

**Empty states** SHALL provide clear feedback for no data scenarios.

**Scenarios:**

**Given** no department selected  
**When** page loads  
**Then** show "Seleccioná un departamento en el mapa"

**Given** department selected but no obras  
**When** API returns empty array  
**Then** show "No hay obras registradas en [municipio]"

---

## Constraints

- All API calls MUST handle loading and error states
- Currency formatting MUST use ARS locale
- Form validation MUST mirror backend Zod schemas
- Map MUST use local la_rioja.json GeoJSON

## Out of Scope

- Export to CSV/Excel
- Print functionality
- Advanced search
- Bulk operations
