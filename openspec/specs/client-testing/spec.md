# Client Testing Specification

## Purpose

Test tooling setup in `client/` with Vitest and React Testing Library. Enables running contract and API-layer tests with `npm test`.

## Requirements

### Requirement: Test Framework Installation

Vitest and React Testing Library MUST be installed as dev dependencies in `client/package.json` with compatible versions.

#### Scenario: NPM Test Runs

- GIVEN Vitest is installed
- WHEN `npm test` (or `npm run test`) is executed in `client/`
- THEN Vitest discovers and runs `*.test.ts` and `*.test.tsx` files
- AND test results are reported with pass/fail status

#### Scenario: Lint Passes with Tests

- GIVEN test files exist alongside source files
- WHEN `npm run lint` (tsc --noEmit) is executed
- THEN TypeScript compilation succeeds with zero errors
- AND test config coexists with main tsconfig

### Requirement: Vitest Configuration

A `vitest.config.ts` file MUST configure Vitest with React Testing Library setup and JSDOM environment.

#### Scenario: Config Discovery

- GIVEN `vitest.config.ts` exists in `client/`
- WHEN Vitest runs
- THEN it uses the config for test environment setup
- AND tests run in JSDOM with React support

#### Scenario: Test Setup File

- GIVEN a test setup file (e.g., `src/test/setup.ts`)
- WHEN tests run
- THEN `@testing-library/jest-dom` matchers are available
- AND global test utilities are configured

### Requirement: Contract Test

A test MUST prove that an outdated/incorrect fixture fails schema validation.

#### Scenario: Drift Detection Test

- GIVEN a fixture with invalid/missing fields
- WHEN the test calls `schema.parse(invalidFixture)`
- THEN `ZodError` is thrown
- AND the test asserts the error contains expected field path

### Requirement: API-Layer Test

An API-layer test using MSW MUST assert request shape and response validation.

#### Scenario: Request Assertion

- GIVEN an API method like `fetchObras({ municipio: 'Capital' })` is called
- WHEN the test runs with MSW
- THEN the request URL matches `/api/obras?municipio=Capital`
- AND the request method is GET with `credentials: 'include'`

#### Scenario: Response Validation

- GIVEN MSW returns a schema-valid mock
- WHEN the API method validates the response
- THEN validation succeeds
- AND the test asserts the returned data matches the mock

## Constraints

- Test files: `*.test.ts` and `*.test.tsx` in `client/src/`
- Test script: `npm test` or `npm run test`
- Lint script: `npm run lint` (tsc --noEmit) must pass
- No E2E tests (Playwright, Cypress) in this change

## Out of Scope

- Component integration tests
- View logic tests
- E2E test setup
