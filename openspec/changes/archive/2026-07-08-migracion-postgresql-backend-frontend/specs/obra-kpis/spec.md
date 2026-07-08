# Spec: Obra KPIs API

## Intent

Provide aggregation endpoints returning sum totals for budget tracking with optional filters.

## Requirements

### REQ-1: Get All KPIs

**GET /api/obras/kpis** SHALL return aggregated totals across all obras.

**Response shape:**
```json
{
  "total": number,        // sum(montoTotal)
  "parcial": number,      // sum(montoParcial)
  "pendiente": number,    // sum(montoPendiente) OR total - parcial
  "count": number         // count(obras)
}
```

**Scenarios:**

**Given** 44 obras in database  
**When** GET /api/obras/kpis  
**Then** return 200 with correct sums for all 44 obras

**Given** empty database  
**When** GET /api/obras/kpis  
**Then** return 200 with { total: 0, parcial: 0, pendiente: 0, count: 0 }

---

### REQ-2: Filtered KPIs by Municipio

**GET /api/obras/kpis?municipio={name}** SHALL return aggregated totals for filtered obras.

**Scenarios:**

**Given** 10 obras with municipio="Capital"  
**When** GET /api/obras/kpis?municipio=Capital  
**Then** return 200 with sums computed only from Capital obras

**Given** no obras with municipio="NonExistent"  
**When** GET /api/obras/kpis?municipio=NonExistent  
**Then** return 200 with { total: 0, parcial: 0, pendiente: 0, count: 0 }

---

### REQ-3: Filtered KPIs by Referente

**GET /api/obras/kpis?referente={name}** SHALL return aggregated totals for filtered obras.

**Matching:** Case-insensitive partial match.

**Scenarios:**

**Given** 5 obras with referente containing "Carlos"  
**When** GET /api/obras/kpis?referente=carlos  
**Then** return 200 with sums from those 5 obras

---

### REQ-4: Combined Filter KPIs

**GET /api/obras/kpis?municipio={name}&referente={name}** SHALL apply both filters with AND logic.

**Scenarios:**

**Given** 3 obras with municipio="Capital" AND referente="Carlos"  
**When** GET /api/obras/kpis?municipio=Capital&referente=Carlos  
**Then** return 200 with sums from those 3 obras only

---

### REQ-5: KPI Consistency

**pendiente** field MUST equal **total - parcial**.

**Scenarios:**

**Given** valid obra data exists  
**When** GET /api/obras/kpis  
**Then** response.pendiente MUST equal response.total - response.parcial

---

## Constraints

- All amounts MUST be non-negative numbers
- `count` represents number of obras included in aggregation
- Filters use same matching rules as filtering API (case-insensitive)
- Empty result set returns zeros, NOT 404

## Out of Scope

- Grouping by tipo or estado
- Time-based aggregations (monthly, yearly)
- Average calculations
- Percentile statistics
