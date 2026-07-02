# ADR-007: Storybook for UI and Vitest for tests

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Renan  
**User story:** [US-0.1](../user-stories/00-foundation.md#us-01--evaluate-and-lock-the-phase-1-tech-stack)

---

## Context

- Visual design is locked (Paper theme, [004-style-guide.md](../specs/004-style-guide.md))
- Engine needs fixture-driven tests ([US-1.8](../user-stories/01-projection-engine.md#us-18--engine-unit-test-suite))
- Calendar components benefit from isolated development before app wiring
- `packages/ui` needs a shared vocabulary for where components live and how Storybook is organized

---

## Decision

| Tool | Package | Purpose |
|---|---|---|
| **Storybook 9** (Vite builder) | `packages/ui` | Components, tokens, engine projection demos |
| **Vitest** | `engine`, `db`, `app`, `ui` | Unit/integration tests |
| **Playwright** | repo root (optional later) | E2E — not Phase 1 blocker |

### Atomic design in `packages/ui`

Storybook and the UI package follow [atomic design](https://atomicdesign.bradfrost.com): build from small, reusable pieces upward.

| Stage | What it is | Examples in Cashflow |
|---|---|---|
| **Atoms** | Smallest UI primitives — no business layout | `Button`, `Chip`, `Indicator`, `Label`, `MoneyAmount`, `FormattedDate` |
| **Molecules** | Simple groups of atoms with one job | `CalendarDayCell` (day number + indicator dots) |
| **Organisms** | Distinct sections of an interface | `AppStatus`, future `CalendarHeader`, `DayPanel` |
| **Templates** | Page-level layout without real data | App shell + calendar grid frame, settings section scaffold |
| **Pages** | Templates wired with realistic or fixture data | Year calendar with engine projection, transactions ledger |

**Rule of thumb:** if a component imports another Cashflow UI component, it is at least a molecule.

#### Folder layout

```text
packages/ui/src/
├── atoms/           # one folder per atom
├── molecules/
├── organisms/
├── templates/       # layout scaffolds (added as screens land)
├── pages/           # fixture-driven Storybook pages (US-1.9+)
└── tokens/
    └── paper.css    # global design tokens
```

Each component folder contains `Component.tsx`, `Component.module.css`, and `Component.stories.tsx`. Story titles mirror the stage: `Atoms/Button`, `Molecules/CalendarDayCell`, etc.

#### Storybook sidebar

The sidebar is ordered by atomic stage:

1. Atoms
2. Molecules
3. Organisms
4. Templates
5. Pages

Each stage has an **Overview** doc entry. New work lands in the correct stage before promotion to `packages/app`.

#### UI boundaries

| Do | Don't |
|---|---|
| Keep atoms presentational — props in, JSX out | Put TanStack Query or router hooks in `packages/ui` |
| Format money and dates via `@cashflow/core` | Hardcode `R$` or `DD/MM` in components |
| Use CSS Modules + Paper tokens | Import `docs/prototype/` CSS directly |
| Compose organisms from molecules/atoms | Duplicate atom styles inside organisms |

`packages/app` owns pages, routes, and data hooks. `packages/ui` receives props and renders.

#### Promotion path

Typical flow when building a screen:

1. **Atom** — e.g. `Indicator` for calendar dot semantics
2. **Molecule** — e.g. `CalendarDayCell` combines day number + indicators
3. **Organism** — e.g. `YearCalendar` grid of day cells
4. **Template** — shell + empty calendar frame
5. **Page** — template + `projectCashFlow()` fixture data (Storybook, then app route)

### Storybook story example (engine fixture — US-1.9)

```tsx
// packages/ui/src/pages/YearCalendarProjection.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { projectCashFlow } from "@cashflow/engine";
import basicFixture from "@cashflow/engine/fixtures/basic-salary-rent.json";
import { YearCalendar } from "../organisms/YearCalendar/YearCalendar";
import type { EngineInput } from "@cashflow/core";

const meta: Meta = {
  title: "Pages/YearProjection",
  component: YearCalendar,
};
export default meta;

type Story = StoryObj;

export const BasicSalaryRent: Story = {
  render: () => {
    const result = projectCashFlow(basicFixture as EngineInput, "2026-06-01");
    return <YearCalendar days={result.days} />;
  },
};
```

### Vitest example (engine)

```typescript
// packages/engine/src/project.test.ts
import { describe, it, expect } from "vitest";
import { projectCashFlow } from "./project";
import creditCardFixture from "../fixtures/credit-card-cycle.json";

describe("credit card cycle", () => {
  it("does not hit working balance on purchase date", () => {
    const result = projectCashFlow(creditCardFixture, "2026-06-01");
    const purchaseDay = result.days.find((d) => d.date === "2026-06-27");
    // assert working balance unchanged vs prior day — details per fixture README
    expect(purchaseDay).toBeDefined();
  });
});
```

---

## Alternatives considered

| Tool | Verdict |
|---|---|
| Vitest | **Accepted** — native Vite integration, fast, TS-first |
| Jest | Rejected — extra config with Vite |
| Ladle | Rejected — smaller ecosystem than Storybook for design-system workflow |
| Cypress component tests | Deferred — Storybook covers visual isolation |
| Flat `components/` folder | Rejected — atomic stages scale better as the calendar system grows |

---

## Consequences

**Positive**

- Storybook proves red dots from real `belowBuffer` before full app
- Vitest runs engine tests in Node without browser
- Same Vite config family across app, ui, storybook
- Atomic sidebar gives designers and developers a predictable place for every component

**Negative**

- Storybook + monorepo path aliases need correct `vite.config`/`tsconfig` references
- Component promotion (atom → page) requires discipline to avoid skipping stages

**Follow-ups**

- [US-0.3](../user-stories/00-foundation.md#us-03--storybook-with-paper-theme-baseline)
- [US-0.4](../user-stories/00-foundation.md#us-04--test-and-ci-baseline)

---

## Traceability

| Topic | Document |
|---|---|
| Visual tokens & semantics | [004-style-guide.md](../specs/004-style-guide.md) |
| Package boundaries | [006-project-structure.md](../specs/006-project-structure.md) |
| US-0.3 acceptance | [00-foundation.md](../user-stories/00-foundation.md) |
