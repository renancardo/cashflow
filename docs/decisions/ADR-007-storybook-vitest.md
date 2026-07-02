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

---

## Decision

| Tool | Package | Purpose |
|---|---|---|
| **Storybook 8** (Vite builder) | `packages/ui` | Components, tokens, engine projection demos |
| **Vitest** | `engine`, `db`, `app`, `ui` | Unit/integration tests |
| **Playwright** | repo root (optional later) | E2E — not Phase 1 blocker |

### Storybook story example (engine fixture — US-1.9)

```tsx
// packages/ui/src/stories/YearCalendarProjection.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { projectCashFlow } from "@cashflow/engine";
import basicFixture from "@cashflow/engine/fixtures/basic-salary-rent.json";
import { YearCalendar } from "../components/YearCalendar/YearCalendar";
import type { EngineInput } from "@cashflow/core";

const meta: Meta = {
  title: "Calendar/YearProjection",
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

---

## Consequences

**Positive**

- Storybook proves red dots from real `belowBuffer` before full app
- Vitest runs engine tests in Node without browser
- Same Vite config family across app, ui, storybook

**Negative**

- Storybook + monorepo path aliases need correct `vite.config`/`tsconfig` references

**Follow-ups**

- [US-0.3](../user-stories/00-foundation.md#us-03--storybook-with-paper-theme-baseline)
- [US-0.4](../user-stories/00-foundation.md#us-04--test-and-ci-baseline)
