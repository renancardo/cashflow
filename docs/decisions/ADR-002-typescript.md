# ADR-002: TypeScript across all packages

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Renan  
**User story:** [US-0.1](../user-stories/00-foundation.md#us-01--evaluate-and-lock-the-phase-1-tech-stack)

---

## Context

The data model is already specified in detail ([001-data-model.md](../specs/001-data-model.md)) with TypeScript-style interfaces for `ProjectionResult`, entities, and enums. The engine, db repos, and UI all share the same shapes.

---

## Decision

Use **TypeScript in every package**: `engine`, `core`, `db`, `ui`, `app`.

- Shared entity types live in **`packages/core`** (or `packages/core/src/types/`)
- Engine imports types from `core`; does not import from `app` or `ui`
- `strict: true` in root `tsconfig` with package-level extensions

Example shared type (from data model):

```typescript
// packages/core/src/projection.ts
export interface ProjectionDay {
  date: string;
  openingBalanceCents: number;
  closingBalanceCents: number;
  inflowsCents: number;
  outflowsCents: number;
  belowBuffer: boolean;
  largeOutflow: boolean;
  items: ProjectionItem[];
}

export interface ProjectionResult {
  days: ProjectionDay[];
  nextNegativeDate: string | null;
  workingBalanceTodayCents: number;
}
```

```typescript
// packages/engine/src/project.ts
import type { EngineInput, ProjectionResult } from "@cashflow/core";

export function projectCashFlow(
  input: EngineInput,
  asOfDate: string = todayIso(),
): ProjectionResult {
  // ...
}
```

---

## Alternatives considered

| Option | Verdict |
|---|---|
| TypeScript everywhere | **Accepted** — one contract from data model → engine → db → UI |
| TS in app only, JS engine | Rejected — engine is the riskiest code; types pay off most there |
| JavaScript + JSDoc | Rejected — harder to keep in sync with 001-data-model as entities grow |

---

## Consequences

**Positive**

- Compile-time checks on `EngineInput` completeness
- TanStack Query hooks get typed `data` / `mutationFn` args
- Refactors across packages are safer

**Negative**

- Slightly slower initial scaffold
- Fixture JSON may need `satisfies EngineInput` or zod validation at boundaries

**Follow-ups**

- Port §3 and §6 interfaces from `001-data-model.md` into `packages/core` as source of truth
- Consider **Zod** at db import/export boundaries (optional, not Phase 1 blocker)
