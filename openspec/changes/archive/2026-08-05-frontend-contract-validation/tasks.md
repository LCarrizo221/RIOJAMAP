# Tasks: Frontend Contract Validation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-450 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Test infra + contracts) → PR 2 (API validation + MSW) |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Test infrastructure (Vitest+RTL+MSW deps + config) + Contract schemas | PR 1 | Base: main; includes test setup, contracts/, vitest.config.ts |
| 2 | API validation layer + MSW handlers + tests | PR 2 | Base: main; depends on PR 1; modifies api/*.ts, adds mocks/, tests |

## Phase 1: Test Infrastructure & Contracts

- [x] 1.1 Install dev dependencies: `msw`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- [x] 1.2 Create `client/vitest.config.ts` extending Vite config with test block (JSDOM environment)
- [x] 1.3 Create `client/src/test/setup.ts` initializing `@testing-library/jest-dom` matchers
- [x] 1.4 Create `client/src/contracts/obra.ts` mirroring server's `ObraResponseSchema` with pagination wrapper
- [x] 1.5 Create `client/src/contracts/auth.ts` mirroring server's `loginSchema` and user response schema
- [x] 1.6 Create `client/src/contracts/index.ts` barrel export for all contract schemas

## Phase 2: Validation Layer

- [x] 2.1 Create `client/src/api/validate.ts` with `validateResponse<T>()` helper and `ContractValidationError` class
- [x] 2.2 Modify `client/src/api/obras.ts`: wrap `getObras()` response with `validateResponse()` using `ObrasListResponseSchema`
- [x] 2.3 Modify `client/src/api/obras.ts`: wrap `getObraKpis()` response with validation
- [x] 2.4 Modify `client/src/api/obras.ts`: wrap `getObraById()` response with `ObraResponseSchema.parse()`
- [x] 2.5 Modify `client/src/api/obras.ts`: wrap `createObra()` and `updateObra()` responses with validation
- [x] 2.6 Modify `client/src/api/auth.ts`: wrap `loginApi()` response (void, but validate if backend returns data)
- [x] 2.7 Modify `client/src/api/auth.ts`: wrap `getMe()` response with `UserSchema.parse()`

## Phase 3: MSW Mock Setup

- [x] 3.1 Create `client/src/mocks/fixtures.ts` with schema-generated mock data using `schema.parse()`
- [x] 3.2 Create `client/src/mocks/handlers.ts` with GET `/api/obras`, POST `/api/auth/login`, GET `/api/auth/me` handlers
- [x] 3.3 Create `client/src/mocks/browser.ts` with MSW browser worker initialization
- [x] 3.4 Create `client/src/mocks/server.ts` with MSW `setupServer()` for Vitest tests
- [x] 3.5 Run `npx msw init client/public/` to generate `mockServiceWorker.js`
- [x] 3.6 Modify `client/main.tsx`: conditionally start MSW worker when `NODE_ENV === 'development'`

## Phase 4: Contract & API Tests

- [x] 4.1 Create `client/src/api/obras.test.ts`: contract test proving outdated fixture fails `ZodError`
- [x] 4.2 Create `client/src/api/obras.test.ts`: API-layer test asserting `getObras()` calls correct URL with filters
- [x] 4.3 Create `client/src/api/obras.test.ts`: API-layer test asserting response validation succeeds with valid mock
- [x] 4.4 Create `client/src/api/auth.test.ts`: contract test for auth schema validation
- [x] 4.5 Create `client/src/api/auth.test.ts`: API-layer test for `loginApi()` with MSW handler
- [x] 4.6 Create `client/src/api/auth.test.ts`: API-layer test for `getMe()` with valid/invalid mocks

## Phase 5: Verification & Cleanup

- [x] 5.1 Run `npm run lint` in `client/` — verify tsc --noEmit passes with zero errors
- [x] 5.2 Run `npm run test` in `client/` — verify all 6 tests pass
- [ ] 5.3 Manual smoke test: start dev server, verify MSW intercepts requests in browser dev tools
- [x] 5.4 Add `test` and `test:watch` scripts to `client/package.json`
- [x] 5.5 Add sync note comment in `client/src/contracts/obra.ts` header: "Last synced with backend: YYYY-MM-DD"
