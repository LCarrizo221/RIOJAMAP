# Design: Parallel Collaboration Governance

## Technical Approach

This is a **docs/governance change** that establishes branch strategy, sync conventions, and merge sequencing for two developers working in parallel. The design focuses on:

1. **Config update**: Modify `openspec/config.yaml` to reflect current state (auth work, git state, active changes)
2. **Spec artifacts**: Specs already exist from spec phase in `openspec/changes/active/2026-08-05-colaboracion-paralela/specs/`
3. **No code changes**: Purely governance/documentation with exact command contracts for apply phase

Maps to proposal's approach: Feature branches with contract-first API design, daily rebase, schema-first merge sequence.

## Architecture Decisions

### Decision: Config-Centric State Tracking

**Choice**: Track all project state (git, auth work, active changes) in `openspec/config.yaml` sections: `context`, `artifacts`, `active_changes`, `archived_changes`

**Alternatives considered**:
- Separate state files per concern → More files to maintain
- Engram-only tracking → Less visible to humans reading repo
- Git tags for state → Doesn't capture auth capabilities

**Rationale**: Single source of truth in config.yaml aligns with existing SDD convention, human-readable, survives compaction.

### Decision: Spec Location Strategy

**Choice**: Specs live in `openspec/changes/active/{change-name}/specs/{spec-name}/spec.md` (already created)

**Alternatives considered**:
- `openspec/specs/{spec-name}/` at root → Harder to associate with change
- Engram-only specs → Less discoverable for new contributors

**Rationale**: Co-locating specs with change improves traceability. Proposal, specs, design all in same change directory.

### Decision: Branch Naming Convention

**Choice**: `feature/schema-evolution` and `feature/frontend-interactivity` (descriptive, owner-clear)

**Alternatives considered**:
- `feature/{developer-name}` → Tightly coupled to person, not work
- `feature/db-changes`, `feature/ui-changes` → Less precise about responsibility

**Rationale**: Names describe work type AND imply ownership without being person-specific.

## Data Flow

```
main (stable)
  ├─ git checkout -b feature/schema-evolution
  │   └─ Colleague: Prisma schema, migrations, API endpoints
  │
  ├─ git checkout -b feature/frontend-interactivity
  │   └─ Lucas: React components, API integration, views
  │
  └─ Daily sync: git fetch origin && git rebase origin/main
  
Merge sequence:
  1. feature/schema-evolution → main (PR + review + deploy backend)
  2. feature/frontend-interactivity → main (rebase first, then PR + deploy frontend)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `openspec/config.yaml` | Modify | Update `context` with git state (4 commits ahead), auth capabilities; update `artifacts` to include auth work; add `active_changes` section |
| `openspec/changes/active/2026-08-05-colaboracion-paralela/design.md` | Create | This design document |
| `CONTRIBUTING.md` or `COLLABORATION.md` | Create (optional) | Human-readable collaboration guide if team wants quick reference (not in openspec structure) |

## Interfaces / Contracts

### Git Command Contracts

**Daily sync (both developers):**
```bash
git fetch origin && git rebase origin/main
```

**Schema merge (Colleague):**
```bash
git checkout feature/schema-evolution
git fetch origin && git rebase origin/main
npm run lint  # tsc --noEmit
git push origin feature/schema-evolution
# Create PR → Review → Merge to main
bash deploy.sh backend
```

**Frontend merge (Lucas):**
```bash
git checkout feature/frontend-interactivity
git fetch origin && git rebase origin/main  # Incorporates schema changes
npm run lint  # tsc --noEmit
git push origin feature/frontend-interactivity
# Create PR → Review → Merge to main
bash deploy.sh frontend
```

**Rollback (VPS):**
```bash
pm2 revert riojamap-backend
```

### Verification Commands

| Check | Command | Location |
|-------|---------|----------|
| TypeScript lint | `npm run lint` | `client/` and `server/` roots |
| Backend health | `curl http://localhost:3003/health` | VPS or local |
| API availability | `curl https://riojamap.devlab1.online/api/obras` | Anywhere |
| Frontend availability | `curl https://riojamap.devlab1.online/` | Anywhere |
| Deploy backend | `bash deploy.sh backend` | Local repo root |
| Deploy frontend | `bash deploy.sh frontend` | Local repo root |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Type checking | `npm run lint` passes | Manual before each PR |
| API contract | Response shape matches spec | Manual curl + visual inspection |
| Deploy verification | Health check + API + Frontend | `verify()` function in deploy.sh |

**Note**: No automated tests added by this change. Testing remains manual per existing `testing.strict_tdd: false` convention.

## Migration / Rollout

No migration required. This is a governance change:

1. **Immediate**: Create branches from current `main`
2. **Daily**: Rebase onto `origin/main`
3. **Merge**: Schema first, frontend second
4. **Config update**: Apply phase updates `openspec/config.yaml`

## Open Questions

- [ ] Team preference: Create separate `CONTRIBUTING.md` for quick reference, or rely solely on openspec structure?
- [ ] Branch lifetime: Proposal says "<1 week" — should we enforce with automated reminders or trust discipline?

## Task Breakdown Outline

For apply phase, tasks map to artifacts:

1. **Task: Update openspec/config.yaml**
   - Update `context` section with git state (4 commits ahead: 8853f36..8791c35)
   - Update `artifacts.openspec` to include `openspec/changes/archive/2026-07-27-auth-y-login/`
   - Update `artifacts.engram` to include auth spec topic keys
   - Add `active_changes` section with current change status
   - Ensure `archived_changes` includes all three completed changes

2. **Task: Verify spec artifacts exist**
   - Confirm `openspec/changes/active/2026-08-05-colaboracion-paralela/specs/parallel-collaboration/spec.md` exists
   - Confirm `openspec/changes/active/2026-08-05-colaboracion-paralela/specs/openspec-project-context/spec.md` exists
   - No modifications needed (created in spec phase)

3. **Task: Create branches (optional — may be done manually)**
   - `git checkout -b feature/schema-evolution` from `main`
   - `git checkout -b feature/frontend-interactivity` from `main`

4. **Task: (Optional) Create CONTRIBUTING.md**
   - One-page summary of branch strategy, sync commands, merge sequence
   - Link to full specs in openspec/

**Done criteria**: Config.yaml updated, specs verified, branches created, zero lint errors, deploy succeeds.

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Type drift** (frontend types diverge from backend API) | Medium | Contract-first: agree types in openspec BEFORE coding; backend owns API shape |
| **Migration conflicts** (Prisma migrations clash) | Medium | Schema owner (Colleague) resolves; keep migrations small and frequent |
| **Config debt** (config.yaml becomes stale) | Low | Update config as part of "done" definition for each SDD change |
| **Branch lifetime exceeds 1 week** | Medium | Daily sync mandatory; if branch >5 days, pair debug or simplify scope |
| **Rebase conflicts in shared files** | Medium | Agree on `types.ts` contract before coding; clear file ownership |
