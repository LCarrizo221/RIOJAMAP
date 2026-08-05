# Delta for openspec-project-context

## MODIFIED Requirements

### Requirement: Project Artifacts List

The `openspec/config.yaml` artifacts section SHALL reflect all completed SDD changes including authentication work from 2026-07-27.

**Current state (BEFORE):**
```yaml
artifacts:
  openspec:
    - openspec/config.yaml
    - openspec/changes/active/2026-07-08-produccion-deploy-vps/
    - openspec/changes/archive/2026-07-08-migracion-postgresql-backend-frontend/
  engram:
    - sdd/riojamap/project-context
    - sdd/riojamap/testing-capabilities
```

**Updated state (AFTER):**
```yaml
artifacts:
  openspec:
    - openspec/config.yaml
    - openspec/changes/archive/2026-07-08-migracion-postgresql-backend-frontend/
    - openspec/changes/archive/2026-07-27-auth-y-login/
    - openspec/changes/active/2026-08-05-colaboracion-paralela/
  engram:
    - sdd/riojamap/project-context
    - sdd/riojamap/testing-capabilities
    - sdd/auth-y-login/specs/user-auth
    - sdd/auth-y-login/specs/role-authorization
    - sdd/auth-y-login/specs/auth-state
    - sdd/auth-y-login/specs/frontend-header
```

(Previously: artifacts list missing auth work from 2026-07-27 and current active change)

#### Scenario: Artifact List Accuracy

- GIVEN new SDD change completed
- WHEN archiving change
- THEN update `openspec/config.yaml` artifacts list to include archived change path

---

### Requirement: Git State Documentation

The `openspec/config.yaml` context section SHALL document current git state including commits ahead of origin.

**Current state:**
- Local commits ahead of `origin/main`: 4 commits
- Commit range: `8853f36..8791c35`
- Auth implementation commits:
  - `8853f36 feat(prisma): add User model with ADMIN/USER roles`
  - `003437e feat(auth): add JWT authenticate and authorize middleware`
  - `11adf71 feat(auth): add login, register, logout, me routes`
  - `28010be feat(auth): integrate auth routes and cookie-parser in Express`
  - `4ea72e5 chore(seed): add default admin user`
  - `a473159 feat(auth): implement frontend auth core (PR #2)`
  - `9405c6d feat(auth): add UserMenu component with logout dropdown`
  - `6d84ffb feat(header): replace census counters with UserMenu, remove census data`
  - `62c8ff7 feat(cleanup): remove census data from types and GeoJSON`
  - `8791c35 fix(api): add credentials include to obra API calls`

(Previously: git state not documented in config.yaml)

#### Scenario: Git State Update

- GIVEN config.yaml context section
- WHEN significant git state change (e.g., 4+ commits ahead)
- THEN document commit count and key commits in config.yaml

---

### Requirement: Auth Capabilities Documentation

The project context SHALL document the four authentication capabilities implemented on 2026-07-27:

| Capability | Type | Engram Topic Key |
|------------|------|------------------|
| `user-auth` | NEW | `sdd/auth-y-login/specs/user-auth` |
| `role-authorization` | NEW | `sdd/auth-y-login/specs/role-authorization` |
| `auth-state` | NEW | `sdd/auth-y-login/specs/auth-state` |
| `frontend-header` | MODIFIED | `sdd/auth-y-login/specs/frontend-header` |

**Key implementations:**
- Backend JWT auth with bcrypt password hashing
- Express middleware: `authenticate()` and `authorize()`
- Frontend AuthContext with login/logout/token verification
- UserMenu component replacing census data in header
- Prisma User model with ADMIN/USER roles

(Previously: auth capabilities not documented in config.yaml)

#### Scenario: Capability Tracking

- GIVEN new capability implemented
- WHEN capability spans backend + frontend
- THEN document capability name, type, and Engram topic key in config.yaml

---

## ADDED Requirements

### Requirement: Active Change Tracking

The `openspec/config.yaml` SHALL track active changes with their status:

```yaml
active_changes:
  - name: 2026-07-08-produccion-deploy-vps
    status: completed
    description: Full production deployment to VPS DevLab1
  - name: 2026-08-05-colaboracion-paralela
    status: in_progress
    description: Parallel collaboration model for 2 developers

archived_changes:
  - name: 2026-07-08-migracion-postgresql-backend-frontend
    status: archived
    description: Backend PostgreSQL + Express API + Frontend adaptation
  - name: 2026-07-27-auth-y-login
    status: archived
    description: Authentication system with JWT, user management, role-based access
```

#### Scenario: Change Status Update

- GIVEN change moves from active to completed
- WHEN change archived
- THEN update status from `in_progress` to `completed` and move to `archived_changes`

---

## Constraints

- `openspec/config.yaml` MUST be updated after each SDD change completion
- Git state documentation MUST include commit count ahead of origin
- Auth capabilities MUST reference their Engram topic keys for traceability
