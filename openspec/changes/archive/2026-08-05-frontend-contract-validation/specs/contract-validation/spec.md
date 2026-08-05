# Contract Validation Specification

## Purpose

Runtime contract enforcement on the client. Ensures API responses match the backend Zod schemas, failing loudly on drift.

## Requirements

### Requirement: Response Validation

The client API layer MUST validate every API response using Zod's `parse()` method against the corresponding contract schema. Validation failures MUST throw a descriptive error with field path and expected type.

#### Scenario: Valid Response Passes

- GIVEN the API returns a response matching the contract
- WHEN `parse()` is called on the response data
- THEN validation succeeds and returns parsed data
- AND the API method returns the validated data to the caller

#### Scenario: Invalid Response Throws

- GIVEN the API returns a response with missing/incorrect fields
- WHEN `parse()` is called on the response data
- THEN validation throws a `ZodError` with field path and expected type
- AND the error propagates to the UI layer for handling

#### Scenario: Unexpected Fields Rejected

- GIVEN the API returns extra fields not in the schema
- WHEN `parse()` is called with `passthrough: false`
- THEN validation throws indicating unexpected fields
- AND drift is caught early

### Requirement: Schema Location

Zod schemas for validation MUST reside in or be importable from `client/src/schemas/`, mirroring `server/src/schemas/obra.ts` and `server/src/schemas/auth.ts`.

#### Scenario: Schema Import

- GIVEN schemas are defined in `server/src/schemas/`
- WHEN the client build runs
- THEN schemas are either imported directly or replicated in `client/src/schemas/`
- AND a sync note documents manual sync on backend changes

### Requirement: API Layer Integration

All API methods in `client/src/api/obras.ts` and `client/src/api/auth.ts` MUST wrap fetch calls with schema validation before returning.

#### Scenario: Obras API Validation

- GIVEN `fetchObras()` calls GET `/api/obras`
- WHEN the response is received
- THEN `obraSchema.array().parse()` is called
- AND validated data is returned or error is thrown

#### Scenario: Auth API Validation

- GIVEN `login()` calls POST `/api/auth/login`
- WHEN the response is received
- THEN `authResponseSchema.parse()` is called
- AND validated data is returned or error is thrown

## Constraints

- Zod `passthrough: false` (strict mode) for all schemas
- Error messages MUST include field path and expected type
- No removal of existing hand-written types in `client/src/types.ts` (future work)
- No E2E tests in this change

## Out of Scope

- Shared/ package creation
- Backend schema changes
- Removal of `client/src/types.ts`
- Component or view logic changes
