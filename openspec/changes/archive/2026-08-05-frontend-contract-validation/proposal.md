# Proposal: Frontend Contract Validation

## Intent

Operationalize the contract-first requirement from the parallel-collaboration spec by giving the frontend a runtime contract net against the backend. Currently, Zod schemas in `server/src/schemas/` define the API contract, but the frontend has hand-written interfaces (`client/src/types.ts`, `client/src/api/*.ts`) with no runtime enforcement. This change adds runtime validation and contract-valid mocks WITHOUT removing existing types (future work) or disrupting parallel workflow.

## Scope

### In Scope
- MSW (Mock Service Worker) setup in `client/` with mocks built from server's Zod schemas (`server/src/schemas/obra.ts`, `server/src/schemas/auth.ts`)
- Zod `parse()` runtime validation in `client/src/api/obras.ts` and `client/src/api/auth.ts` — validate each response; fail loud on mismatch
- Vitest + React Testing Library setup in `client/` with:
  - First contract test (old fixture must fail schema parse)
  - API-layer test using MSW
- Zero impact on existing frontend behavior: `npm run lint` (tsc --noEmit) passes

### Out of Scope
- Shared/ package creation (explicitly deferred)
- Backend changes (colleague owns backend/Prisma schema in separate branch)
- Removing client hand-written types (`client/src/types.ts`) — this is future work
- E2E tests (Playwright, Cypress, etc.)
- Component or view logic changes

## Capabilities

### New Capabilities
- `contract-validation`: Runtime Zod validation of API responses in client API layer
- `mock-service-worker`: MSW setup with schema-driven mocks for dev/test

### Modified Capabilities
- None (this change adds validation layer without modifying existing spec-level behavior)

## Approach

1. **MSW Setup**: Install `msw` as dev dependency; configure service worker in `client/src/mocks/`; create handlers that generate fixtures using `ZodSchema.parse()` to ensure contract-valid mocks
2. **Runtime Validation**: Import Zod schemas (or replicate them in client if import not feasible due to monorepo structure); wrap `fetch()` calls in `client/src/api/*.ts` with `schema.parse(responseData)`; throw descriptive error on mismatch
3. **Test Setup**: Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`; configure `vitest.config.ts`; write contract test proving old fixture fails; write API test using MSW handlers
4. **Zod Decision**: Use `passthrough: false` (strict) to catch unexpected fields early; error messages include field path and expected type

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/package.json` | New deps | `msw`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom` |
| `client/src/mocks/` | New | MSW handlers, browser setup, schema-driven fixtures |
| `client/src/api/obras.ts` | Modified | Add Zod `parse()` validation to all response paths |
| `client/src/api/auth.ts` | Modified | Add Zod `parse()` validation to login/me responses |
| `client/vitest.config.ts` | New | Vitest configuration with React Testing Library setup |
| `client/src/api/obras.test.ts` | New | Contract test + API-layer MSW test |
| `client/src/mocks/browser.ts` | New | MSW browser worker initialization |
| `client/src/mocks/handlers.ts` | New | Request handlers using Zod schemas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Test framework first install in repo | Medium | Follow Vitest + RTL docs closely; use minimal config; test locally before committing |
| MSW complexity (service worker registration, HTTPS in dev) | Medium | Use MSW's default browser setup; document setup in `client/README.md` if needed |
| Zod strict vs passthrough decision | Low | Start with strict (`passthrough: false`) to catch drift early; can relax later if backend adds fields frequently |
| Schema import from monorepo | Medium | If direct import from `server/` fails due to build setup, replicate schemas in `client/src/schemas/` with note to sync on backend changes |
| Performance overhead of runtime validation | Low | Zod validation is fast (<1ms per response); measure if concerns arise |

## Rollback Plan

1. Revert commit(s) introducing MSW, Vitest, and Zod validation
2. Remove new dependencies from `client/package.json`
3. Restore original `client/src/api/*.ts` without validation
4. Delete `client/src/mocks/`, `client/vitest.config.ts`, test files
5. Frontend continues without runtime contract net (status quo ante)

Rollback is safe because this change adds a validation layer without modifying core frontend logic or views.

## Dependencies

- None (self-contained in client/; no backend changes required)
- Colleague should be notified of schema-driven mock approach for alignment, but no code coordination needed

## Success Criteria

- [ ] `npm run lint` passes in `client/` (tsc --noEmit, zero errors)
- [ ] `npm run test` passes in `client/` (Vitest contract test + API test)
- [ ] Contract test proves old/outdated fixture fails Zod parse (validates test catches drift)
- [ ] Frontend behavior unchanged (no view/component logic modifications)
- [ ] MSW mocks are contract-valid (generated via `ZodSchema.parse()`)
- [ ] Runtime validation throws descriptive error on schema mismatch
