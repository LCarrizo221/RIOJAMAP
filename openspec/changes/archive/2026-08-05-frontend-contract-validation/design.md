# Design: Frontend Contract Validation

## Technical Approach

Add runtime contract validation to the client API layer using Zod schemas that mirror the server's schemas. MSW mocks are generated from these same schemas, ensuring contract-valid fixtures. Vitest runs contract and API-layer tests. This is a **validation layer addition** — existing types and views remain unchanged.

## Architecture Decisions

### Decision: Schema Source & Import Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **A: Import server schemas** | Requires shared package or complex tsconfig path mapping; server deps in client build | ❌ Rejected |
| **B: Client-side mirrors** | Duplication risk, but tests catch drift; minimal config changes | ✅ **Selected** |
| **C: Shared/ folder** | Best long-term, but adds monorepo complexity not needed for 2-dev parallel work | ❌ Deferred |

**Choice**: Client defines its own Zod schemas in `client/src/contracts/` mirroring `server/src/schemas/`.

**Rationale**: 
- **Minimal diff**: No root-level `shared/` package, no tsconfig path mapping changes, no build pipeline modifications
- **Parallel workflow**: Backend and frontend can evolve independently; sync happens at merge time
- **Drift detection**: MSW fixtures + contract tests fail immediately if schemas diverge from actual API
- **Fast-forward safe**: This change doesn't block or depend on backend changes

**Config changes needed**: None for tsconfig/vite. Only `package.json` adds dev dependencies (MSW, Vitest, RTL).

### Decision: Runtime Validation Shape

**Choice**: Single helper `validateResponse<T>(data: unknown, schema: ZodSchema<T>): T` in `client/src/api/validate.ts`.

**Error format**:
```typescript
class ContractValidationError extends Error {
  constructor(message: string, issues: ZodIssue[]) {
    super(`Contract validation failed: ${message}`);
    this.name = 'ContractValidationError';
    // Include field path and expected type from ZodIssue
  }
}
```

**Pagination wrapper**: Compose schemas:
```typescript
const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number()
});

const ObrasListResponseSchema = z.object({
  data: ObraSchema.array(),
  pagination: PaginationSchema
});
```

### Decision: MSW Setup

**Choice**: Schema-driven fixtures using `schema.parse()` on template objects.

**File structure**:
```
client/src/mocks/
├── browser.ts        # Worker initialization
├── handlers.ts       # Request handlers
├── fixtures.ts       # Schema-valid mock data
└── server.ts         # Node server for tests
```

**Dev wiring**: `main.tsx` conditionally starts worker:
```typescript
if (process.env.NODE_ENV === 'development') {
  const { worker } = await import('./mocks/browser');
  worker.start();
}
```

**Test wiring**: Vitest setup file calls `setupServer()` from MSW node.

### Decision: Vitest Setup

**Choice**: Merge Vitest config with existing Vite config, use JSDOM environment.

**Config**: `vitest.config.ts` extends Vite config with test block.
**Setup file**: `client/src/test/setup.ts` for `@testing-library/jest-dom` matchers.
**Scripts**: `"test": "vitest run"`, `"test:watch": "vitest"` in `package.json`.

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  API Call   │ ──→ │  Fetch +     │ ──→ │  Zod Parse  │
│  (obras.ts) │     │  response    │     │  (validate) │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                    │
                           │ (MSW intercept)    │ (throws on mismatch)
                           ▼                    ▼
                    ┌──────────────┐     ┌─────────────┐
                    │   MSW        │     │  Return T   │
                    │  Handlers    │     │  or Error   │
                    └──────────────┘     └─────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `client/src/contracts/obra.ts` | Create | Zod schemas mirroring server's `obra.ts` |
| `client/src/contracts/auth.ts` | Create | Zod schemas mirroring server's `auth.ts` |
| `client/src/contracts/index.ts` | Create | Barrel export for all contract schemas |
| `client/src/api/validate.ts` | Create | Generic validation helper + error class |
| `client/src/api/obras.ts` | Modify | Wrap all `response.json()` with `validateResponse()` |
| `client/src/api/auth.ts` | Modify | Wrap login/me responses with `validateResponse()` |
| `client/src/mocks/browser.ts` | Create | MSW browser worker init |
| `client/src/mocks/handlers.ts` | Create | Request handlers using schema.parse() |
| `client/src/mocks/fixtures.ts` | Create | Schema-valid mock data templates |
| `client/src/mocks/server.ts` | Create | MSW Node server for Vitest |
| `client/src/test/setup.ts` | Create | RTL + jest-dom setup |
| `client/vitest.config.ts` | Create | Vitest config (extends Vite) |
| `client/public/mockServiceWorker.js` | Create | Generated via `msw init public/` |
| `client/package.json` | Modify | Add `msw`, `vitest`, `@testing-library/*` devDeps |
| `client/main.tsx` | Modify | Conditional MSW worker start in dev |

## Interfaces / Contracts

**Validation helper**:
```typescript
// client/src/api/validate.ts
export function validateResponse<T>(data: unknown, schema: ZodSchema<T>): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new ContractValidationError(
      `Field '${issue.path.join('.')}' - ${issue.message}`,
      result.error.issues
    );
  }
  return result.data;
}
```

**Usage in API layer**:
```typescript
// client/src/api/obras.ts
export async function getObras(filters?: FilterOptions): Promise<ObrasListResponse> {
  const params = new URLSearchParams();
  if (filters?.municipio) params.append('municipio', filters.municipio);
  if (filters?.referente) params.append('referente', filters.referente);
  
  const response = await fetch(`${API_BASE}/obras?${params.toString()}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch obras');
  }
  const data = await response.json();
  return validateResponse(data, ObrasListResponseSchema);
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Contract** | Outdated fixture fails schema parse | Test with intentionally invalid fixture, assert `ZodError` thrown |
| **API** | `getObras()` calls correct URL, validates response | MSW handler + assert request URL + assert returned data |
| **Integration** | Login flow with valid/invalid credentials | MSW handlers for login + assert error messages |

**First test** (proves drift detection):
```typescript
// client/src/api/obras.test.ts
test('outdated fixture fails schema validation', () => {
  const invalidFixture = { id: 1, municipio: 'Capital' }; // missing required fields
  expect(() => ObraSchema.parse(invalidFixture)).toThrow(ZodError);
});
```

## Migration / Rollout

**No migration required**. This change:
- Adds validation without removing existing types
- Does not modify view/component logic
- Is backward compatible (valid responses pass through unchanged)

**Rollout**:
1. Add schemas + validate helper (no callers yet)
2. Wire up MSW (dev-only, no production impact)
3. Add tests (run in CI, no production impact)
4. Wrap API calls with validation (one file at a time, verify each)

## Open Questions

- [ ] Should validation be disabled in production for performance, or always-on for safety? **Recommendation**: Always-on; Zod is fast (<1ms), and catching drift in prod is valuable.
- [ ] Should we log validation errors to an error tracker (Sentry)? **Deferred**: Out of scope for this change.
