# Mock Service Worker Specification

## Purpose

Schema-driven MSW mocks for development and testing. Mocks are generated from Zod schemas, ensuring contract-valid fixtures that auto-invalidate on schema changes.

## Requirements

### Requirement: Schema-Driven Fixtures

MSW handlers MUST generate mock data by calling `ZodSchema.parse()` on fixture templates, ensuring all mocks conform to the contract.

#### Scenario: Happy Path Mock

- GIVEN a valid fixture template with all required fields
- WHEN `obraSchema.parse(fixture)` is called
- THEN the parsed mock is returned with all schema constraints satisfied
- AND the mock is used in the MSW handler response

#### Scenario: Fixture Regeneration on Schema Change

- GIVEN a schema change adds a required field
- WHEN the existing fixture lacks that field
- THEN `parse()` fails, forcing fixture update
- AND mocks cannot be served until fixtures are schema-compliant

### Requirement: MSW Browser Setup

MSW MUST be configured for browser usage in `client/src/mocks/browser.ts` with service worker registration.

#### Scenario: Dev Mode Activation

- GIVEN `process.env.NODE_ENV === 'development'`
- WHEN the app initializes
- THEN `browser.setupWorker()` is called
- AND MSW intercepts API requests in dev

#### Scenario: Test Mode Activation

- GIVEN Vitest tests run with MSW
- WHEN tests initialize
- THEN `setupServer()` is used for Node environment
- AND MSW intercepts requests in test context

### Requirement: Request Handlers

Handlers in `client/src/mocks/handlers.ts` MUST mirror backend routes and use schema-generated fixtures.

#### Scenario: GET /api/obras Handler

- GIVEN a request to GET `/api/obras` with optional filters
- WHEN the handler is triggered
- THEN return an array of schema-valid obra mocks
- AND response shape matches `obraSchema.array()`

#### Scenario: POST /api/auth/login Handler

- GIVEN a request to POST `/api/auth/login` with credentials
- WHEN the handler is triggered
- THEN return a schema-valid auth response mock
- AND response shape matches `authResponseSchema`

### Requirement: Drift Detection

An outdated fixture MUST fail schema validation, proving the mock system catches contract drift.

#### Scenario: Outdated Fixture Fails

- GIVEN a fixture missing a newly required field
- WHEN schema validation runs
- THEN `parse()` throws `ZodError`
- AND the test fails, alerting to drift

## Constraints

- MSW version: latest stable as of 2026-08-05
- Fixtures MUST be derived from schemas, not hand-written
- No shared/ package; schemas replicated or imported from server/
- Handlers mirror backend routes exactly

## Out of Scope

- E2E test coverage
- Production mock usage
- Complex scenario mocking (edge cases deferred)
