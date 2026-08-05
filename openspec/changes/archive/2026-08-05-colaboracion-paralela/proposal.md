# Proposal: Parallel Collaboration Governance

## Intent

Enable two developers (Lucas: frontend interactivity/views; colleague: database schema) to work in PARALLEL without merge conflicts or blocking dependencies.

## Scope

### In Scope
- Update `openspec/config.yaml` with current state (auth work, git state)
- Feature branches: `feature/schema-evolution` + `feature/frontend-interactivity`
- Contract-first API design (TypeScript interfaces before coding)
- Daily rebase onto `main`
- Merge sequence: schema first, then frontend
- Verification: `npm run lint` + PR review + deploy check

### Out of Scope
- CI/CD pipeline changes
- Code review process changes
- Testing framework additions
- Real-time collaboration tooling

## Capabilities

### New Capabilities
- `parallel-collaboration`: Branch strategy, sync conventions, merge sequencing

### Modified Capabilities
- None

## Approach

**Feature Branches with Contract-First**

| Workstream | Branch | Owner |
|------------|--------|-------|
| Schema Evolution | `feature/schema-evolution` | Colleague |
| Frontend Interactivity | `feature/frontend-interactivity` | Lucas |

**Workflow:**
1. Define API types in shared file before coding
2. Parallel development on feature branches
3. Daily rebase onto `main`
4. Schema merges first, frontend rebases on top
5. Lint + type check + PR review + deploy

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Single feature branch | Blocking dependency |
| Trunk-based + feature flags | Overhead, schema can't be flagged |
| Separate repos | GeoJSON/types create coupling |

## Affected Areas

| Area | Impact |
|------|--------|
| `openspec/config.yaml` | Modified |
| `openspec/changes/active/2026-08-05-colaboracion-paralela/` | New |
| Git workflow | Modified |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API contract mismatch | Medium | TypeScript interfaces in shared file |
| Merge conflicts | Medium | Daily rebase, clear file ownership |
| Schema breaks frontend | Low | Backend merges first, frontend rebases |
| Branch drift | Medium | Daily sync, keep branches <1 week |

## Rollback Plan

1. **Conflicts unresolvable**: Delete branches, resume sequential workflow
2. **Contract breaks**: Backend fixes API, frontend rebases
3. **Deploy fails**: `pm2 revert riojamap-backend`
4. **Git cleanup**: Delete branches, reset to `main`

## Dependencies

- None

## Success Criteria

- [ ] `openspec/config.yaml` reflects auth work (4 commits, 4 specs)
- [ ] `openspec/config.yaml` reflects git state (4 ahead of origin/main)
- [ ] Zero merge conflicts (or resolved <30 min)
- [ ] Frontend types match backend API exactly
- [ ] Deploy succeeds after merge
- [ ] No regression in existing specs (obra-kpis, obra-crud, obra-filtering, frontend-obra-display)
