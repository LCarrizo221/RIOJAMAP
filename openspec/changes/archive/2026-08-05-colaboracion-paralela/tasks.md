# Tasks: Parallel Collaboration Governance

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80-120 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Update openspec/config.yaml with current state | PR 1 | Docs-only change; includes git state, auth artifacts, active_changes section |

## Phase 1: Config Update

- [x] 1.1 Update `context` section in `openspec/config.yaml` to document git state (4 commits ahead: 8853f36..8791c35) and list all 10 auth-related commits
- [x] 1.2 Update `artifacts.openspec` in `openspec/config.yaml` to add `openspec/changes/archive/2026-07-27-auth-y-login/` and `openspec/changes/active/2026-08-05-colaboracion-paralela/`
- [x] 1.3 Update `artifacts.engram` in `openspec/config.yaml` to add all 4 auth spec topic keys (user-auth, role-authorization, auth-state, frontend-header)
- [x] 1.4 Verify `active_changes` section exists with current change marked as `in_progress`
- [x] 1.5 Verify `archived_changes` section includes all three completed changes (produccion-deploy-vps, migracion-postgresql-backend-frontend, auth-y-login)

## Phase 2: Verification

- [x] 2.1 Confirm spec artifacts exist at `openspec/changes/active/2026-08-05-colaboracion-paralela/specs/parallel-collaboration/spec.md`
- [x] 2.2 Confirm spec artifacts exist at `openspec/changes/active/2026-08-05-colaboracion-paralela/specs/openspec-project-context/spec.md`
- [x] 2.3 Run `npm run lint` in both `client/` and `server/` directories to verify zero TypeScript errors
- [x] 2.4 Validate YAML syntax in `openspec/config.yaml` (no indentation errors)

## Phase 3: Optional Documentation

- [x] 3.1 (Optional) Create `CONTRIBUTING.md` with one-page summary: branch strategy, daily sync command, merge sequence, verification gates
- [x] 3.2 (Optional) Link `CONTRIBUTING.md` to full specs in `openspec/changes/active/2026-08-05-colaboracion-paralela/`

## Phase 4: Branch Setup (Manual — May Be Done Outside Apply)

- [ ] 4.1 Create `feature/schema-evolution` branch from current `main`
- [ ] 4.2 Create `feature/frontend-interactivity` branch from current `main`
- [ ] 4.3 Document branch creation in team communication (Slack/email)
