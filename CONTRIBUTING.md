# Contributing to RiojaMAP

## Quick Reference for Parallel Development

This guide covers branch strategy, sync conventions, and merge sequencing for parallel development between frontend (Lucas) and schema/backend (colleague) workstreams.

## Branch Strategy

| Branch | Owner | Responsibility |
|--------|-------|----------------|
| `feature/schema-evolution` | Colleague | Database schema, Prisma migrations, backend API |
| `feature/frontend-interactivity` | Lucas | Frontend views, interactivity, API integration |

Both branches are created from `main` and merge back via pull requests.

## Daily Sync (MANDATORY)

Before coding, run:

```bash
git fetch origin && git rebase origin/main
```

Conflict resolution:
- Schema conflicts → Colleague resolves
- Frontend conflicts → Lucas resolves
- Shared files (`types.ts`, API contracts) → Agree before coding

## Merge Sequence

1. **Schema first**: `feature/schema-evolution` → `main`
   - Backend is deployable independently
2. **Frontend second**: `feature/frontend-interactivity` → `main`
   - Rebase onto `main` first to incorporate schema changes

## Contract-First Rule

Agree on API/type shapes in OpenSpec **BEFORE** coding:
- `openspec/changes/{change-name}/specs/` — Human-readable contracts
- `server/src/types.ts` or Prisma schema — Server source of truth
- `client/src/types.ts` — Client types (MUST NOT diverge from server)

Type drift prevention: Backend owns API response shape; frontend imports or mirrors types.

## Verification Gates (Before PR Merge)

All gates MUST pass:

1. **Lint**: `npm run lint` (tsc --noEmit) passes with zero errors in both `client/` and `server/`
2. **API Shape Check**: Response shape matches OpenSpec contract
3. **PR Review**: At least one reviewer approves
   - **>400 lines**: Use [chained-pr skill](https://github.com/LCarrizo221/RIOJAMAP/blob/main/.opencode/skills/chained-pr/SKILL.md) to split into smaller PRs
4. **Deploy Check**: `bash deploy.sh backend` or `bash deploy.sh frontend` succeeds

## Conventional Commits

Use Conventional Commits format:
- `feat(scope): description`
- `fix(scope): description`
- `chore(scope): description`
- `docs(scope): description`

**Never** add "Co-Authored-By" or AI attribution to commits.

## OpenSpec Artifacts

After completing any SDD change:
1. Update `openspec/config.yaml` with new artifacts
2. Mark tasks complete in `openspec/changes/{change-name}/tasks.md`
3. Ensure config reflects current git state (commits ahead, key commits)

## Rollback

If deploy fails after merge:
```bash
pm2 revert riojamap-backend
```

If branches become unresolvable:
```bash
git branch -D feature/schema-evolution feature/frontend-interactivity
# Resume sequential workflow
```

## Full Specifications

For complete details, see:
- `openspec/changes/active/2026-08-05-colaboracion-paralela/specs/parallel-collaboration/spec.md`
- `openspec/changes/active/2026-08-05-colaboracion-paralela/design.md`
