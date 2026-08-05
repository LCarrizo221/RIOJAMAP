# Parallel Collaboration Specification

## Purpose

Enable two developers (Lucas: frontend interactivity/views; colleague: database schema) to work in parallel without merge conflicts or blocking dependencies through contract-first API design and disciplined branch management.

## Requirements

### Requirement: Branch Strategy

The system SHALL maintain two long-lived feature branches for parallel development:

| Branch | Owner | Responsibility |
|--------|-------|----------------|
| `feature/schema-evolution` | Colleague | Database schema changes, Prisma migrations, backend API shape |
| `feature/frontend-interactivity` | Lucas | Frontend views, interactivity, API integration |

Both branches SHALL be created from `main` and merge back to `main` via pull requests.

#### Scenario: Branch Creation

- GIVEN `main` is stable and up-to-date
- WHEN starting parallel work
- THEN create both branches from `main` with descriptive names

#### Scenario: Branch Isolation

- GIVEN both branches exist
- WHEN developing schema changes
- THEN commit only to `feature/schema-evolution`, never to `feature/frontend-interactivity`

---

### Requirement: Daily Sync Convention

Developers SHALL synchronize branches daily using rebase:

```bash
git fetch origin && git rebase origin/main
```

Conflict resolution ownership:
- Schema conflicts → Colleague resolves
- Frontend conflicts → Lucas resolves
- Shared files (types.ts, API contracts) → Agreed before coding

#### Scenario: Daily Sync

- GIVEN developer has local feature branch
- WHEN starting work session
- THEN run `git fetch origin && git rebase origin/main` before coding

#### Scenario: Conflict Resolution

- GIVEN rebase reveals conflicts in owned files
- WHEN conflicts detected
- THEN branch owner resolves within 30 minutes or requests pair debugging

---

### Requirement: Merge Sequence

Merges SHALL follow this order:

1. **Schema first**: `feature/schema-evolution` → `main` (backend deployable independently)
2. **Frontend second**: `feature/frontend-interactivity` → `main` (rebases on schema changes)

Both branches MUST pass verification before merge:
- `npm run lint` (tsc --noEmit) passes with zero errors
- API shape matches contract in openspec
- PR review completed (use chained-pr skill if >400 lines)

#### Scenario: Schema Merge

- GIVEN schema changes complete and tested
- WHEN ready to merge
- THEN run `npm run lint`, create PR, merge to `main`, deploy backend

#### Scenario: Frontend Rebase Before Merge

- GIVEN schema merged to `main`
- WHEN frontend ready to merge
- THEN `git rebase origin/main` to incorporate schema changes
- THEN run `npm run lint`, create PR, merge to `main`

---

### Requirement: Contract-First API Design

API type shapes SHALL be agreed in openspec BEFORE coding:

| Contract Location | Purpose |
|-------------------|---------|
| `openspec/changes/{change-name}/specs/` | Human-readable API contracts |
| `server/src/types.ts` or Prisma schema | Server-side source of truth |
| `client/src/types.ts` | Client-side types (MUST NOT diverge from server) |

Type drift prevention:
- Backend owns API response shape
- Frontend imports or mirrors types from shared definition
- Any API change requires openspec update BEFORE implementation

#### Scenario: New Endpoint Contract

- GIVEN new API endpoint needed
- WHEN designing endpoint
- THEN write contract in openspec with request/response shape
- THEN implement server-side types first
- THEN implement client-side integration

#### Scenario: Type Change Agreement

- GIVEN existing API needs modification
- WHEN change affects frontend
- THEN update openspec contract first
- THEN notify other developer
- THEN implement on both sides

---

### Requirement: Verification Gates

Before any PR merge, the following MUST pass:

1. **Lint**: `npm run lint` (tsc --noEmit) with zero errors
2. **API Shape Check**: Response shape matches openspec contract
3. **PR Review**: At least one reviewer approves (use chained-pr if >400 lines)
4. **Deploy Check**: `bash deploy.sh backend` or `bash deploy.sh frontend` succeeds

#### Scenario: Pre-Merge Verification

- GIVEN feature branch ready for merge
- WHEN creating PR
- THEN run `npm run lint` locally and verify zero errors
- THEN verify API responses match contract
- THEN request PR review
- THEN verify deploy succeeds on staging

#### Scenario: Large PR Handling

- GIVEN PR exceeds 400 lines
- WHEN submitting for review
- THEN split into chained PRs using chained-pr skill
- THEN link PRs in dependency order

---

### Requirement: Rollback Protocol

If merge causes issues:

1. **Conflicts unresolvable**: Delete branches, resume sequential workflow
2. **Contract breaks**: Backend fixes API within 24h, frontend rebases
3. **Deploy fails**: `pm2 revert riojamap-backend` on VPS
4. **Git cleanup**: `git branch -D <branch>` to remove feature branches

#### Scenario: Deploy Failure

- GIVEN deploy fails after merge
- WHEN failure detected
- THEN run `pm2 revert riojamap-backend` on VPS
- THEN fix issue on branch, re-deploy

---

## Constraints

- Branches MUST NOT live longer than 1 week without merge
- Daily sync is MANDATORY, not optional
- Contract changes require mutual agreement before coding
- No direct commits to `main`; all changes via PR

## Out of Scope

- CI/CD pipeline automation
- Real-time collaboration tooling
- Code review process changes beyond chained-pr
- Testing framework additions
