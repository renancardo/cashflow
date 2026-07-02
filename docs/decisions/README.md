# Architecture Decision Records (ADRs)

Formal record of **why** Phase 1 technical choices were made. Produced as part of [US-0.1](../user-stories/00-foundation.md#us-01--evaluate-and-lock-the-phase-1-tech-stack).

---

## Index

| ADR | Title | Status |
|---|---|---|
| [001](./ADR-001-monorepo-react-vite.md) | Monorepo, React, Vite, pnpm | **Accepted** |
| [002](./ADR-002-typescript.md) | TypeScript across all packages | **Accepted** |
| [003](./ADR-003-css-modules.md) | CSS Modules + design tokens (not Tailwind) | **Accepted** |
| [004](./ADR-004-client-data-layer.md) | TanStack Query + `packages/db` | **Accepted** |
| [005](./ADR-005-tanstack-router.md) | TanStack Router | **Accepted** |
| [006](./ADR-006-client-storage.md) | Client persistence (Dexie vs SQLite WASM) | **Proposed** — criteria locked; pick at US-0.2 |
| [007](./ADR-007-storybook-vitest.md) | Storybook + Vitest | **Accepted** |

---

## ADR template

Each ADR follows:

1. **Context** — problem and constraints  
2. **Decision** — what we chose  
3. **Alternatives considered** — what we rejected and why  
4. **Consequences** — trade-offs and follow-ups  
5. **Code examples** — where helpful (see ADR-003, ADR-004)

---

## Traceability

| Document | Role |
|---|---|
| [002-phase-1-scope.md](../specs/002-phase-1-scope.md) | NFRs (local-first, performance, privacy) |
| [004-style-guide.md](../specs/004-style-guide.md) | Paper tokens — source for CSS variables |
| [005-prd.md](../specs/005-prd.md) | Product goals |
| [006-project-structure.md](../specs/006-project-structure.md) | Folder layout, runtime layers, typical user flows |
