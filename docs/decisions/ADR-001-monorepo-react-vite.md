# ADR-001: Monorepo with React, Vite, and pnpm workspaces

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Renan  
**User story:** [US-0.1](../user-stories/00-foundation.md#us-01--evaluate-and-lock-the-phase-1-tech-stack)

---

## Context

Phase 1 is a **local-first** personal cash flow app with:

- A **pure projection engine** (highest-risk logic)
- A **calendar-heavy React UI** (9 screens, Paper theme)
- **No cloud backend** in Phase 1

The stack must support engine-first development, component isolation (Storybook), and a clear package boundary so projection math never depends on React.

Constraints from [002-phase-1-scope.md](../specs/002-phase-1-scope.md):

- Local-first storage and JSON export
- Projection recompute &lt; 500 ms
- No telemetry, no LLM calls

---

## Decision

| Area | Choice |
|---|---|
| Monorepo | **pnpm workspaces** (`packages/*`) |
| UI library | **React 19** (current stable at scaffold time) |
| Build tool | **Vite** |
| Package layout | `engine`, `core`, `db`, `ui`, `app` (see project-structure spec) |

Root scripts (target):

```json
{
  "scripts": {
    "dev": "pnpm --filter @cashflow/app dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "storybook": "pnpm --filter @cashflow/ui storybook"
  }
}
```

---

## Alternatives considered

### UI: React vs Svelte vs Vue

| | React | Svelte / Vue |
|---|---|---|
| Calendar grid + panels | Large ecosystem, Storybook mature | Viable, smaller hiring/docs surface for this solo project |
| TanStack Query / Router | First-class | Adapters exist, less uniform |
| Prototype port | JSX maps cleanly from HTML prototypes | Rewrite cost |

**Rejected:** Svelte, Vue — no strong advantage for a solo builder already targeting React + TanStack stack.

### Build: Vite vs Next.js

| | Vite SPA | Next.js |
|---|---|---|
| Local-first, no server | Natural fit | SSR/RSC unnecessary complexity |
| Storybook | Standard pairing | Heavier config |
| Deployment | Static or simple host | Overkill for personal app |

**Rejected:** Next.js — no SSR requirement; adds server concepts we explicitly avoid.

### Package manager: pnpm vs npm

**Chosen pnpm** — efficient disk use, strict dependency resolution, good monorepo ergonomics.

---

## Consequences

**Positive**

- Engine package stays importable and testable without a browser
- Vite gives fast HMR for calendar UI work
- pnpm `workspace:*` links packages without publish step

**Negative**

- Monorepo setup cost before first visible feature
- Must enforce dependency direction (engine ↑ nothing from React)

**Follow-ups**

- [US-0.2](../user-stories/00-foundation.md#us-02--initialize-the-application-monorepo) — scaffold packages
- Document layout in [006-project-structure.md](../specs/006-project-structure.md)

---

## Non-goals (Phase 1)

- Cloud sync or auth
- SSR / edge deployment
- Multi-currency
- Native mobile shell
