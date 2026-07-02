# Epic 1 — Projection engine & fixtures

Pure JavaScript cash-flow projection engine with **fixture datasets** and automated tests. **Build early** — calendar and most screens consume `ProjectionResult`.

> **Contract:** Input/output types must match [001-data-model.md §6](../specs/001-data-model.md#6-derived-types-projection-engine-output).

---

## US-1.1 — Define engine input/output contract

**Persona:** Developer

**Story:** As a developer, I want a **typed engine contract** (`EngineInput` → `ProjectionResult`) so that UI, tests, and fixtures share one API.

**Priority:** P0  
**Depends on:** US-0.2

### Acceptance criteria

- [ ] `projectCashFlow(input, asOfDate?)` (or equivalent) exported from `packages/engine`
- [ ] Input includes: `accounts`, `transactions`, `plannedItems`, `plannedItemOverrides`, `creditCardStatements`, `installments`, `installmentPlans`, `settings`
- [ ] Output matches `ProjectionResult`: `days[]`, `nextNegativeDate`, `workingBalanceTodayCents`
- [ ] Each `ProjectionDay` includes: `date`, `openingBalanceCents`, `closingBalanceCents`, `inflowsCents`, `outflowsCents`, `belowBuffer`, `largeOutflow`, `items[]`
- [ ] Money is **integer cents** throughout; no floats in engine internals

---

## US-1.2 — Daily working balance from anchors and actuals

**Persona:** User (via calendar)

**Story:** As a user, I want the engine to **compute daily aggregate working balance** from account anchors and actual transactions so that past days reflect real cash on hand.

**Priority:** P0  
**Depends on:** US-1.1

### Acceptance criteria

- [ ] Only accounts with `isWorking === true` contribute to aggregate working balance
- [ ] Per-account balance forward from `anchorBalanceCents` + `anchorDate` using transactions with `effectiveDate >= anchorDate`
- [ ] Income increases working balance; expense decreases; transfer debits source and credits destination (single-row model)
- [ ] Re-anchoring: transactions before new `anchorDate` do not affect balance for that account
- [ ] `workingBalanceTodayCents` equals closing balance on `asOfDate` (default today)

---

## US-1.3 — Expand planned items and recurrence

**Persona:** User

**Story:** As a user, I want **recurring and one-off planned items** to appear on the correct future dates so that salary, rent, and subscriptions show in the forecast.

**Priority:** P0  
**Depends on:** US-1.2

### Acceptance criteria

- [ ] Recurrence modes: `once`, `weekly`, `monthly`, `yearly` within `Settings.horizonMonths` (default 24)
- [ ] Monthly items respect `dayOfMonth` (clamp/end-of-month rule documented)
- [ ] `PlannedItemOverride` with `skipped` suppresses an occurrence; `modified` overrides amount/date
- [ ] `isActive === false` items excluded from projection
- [ ] Settled planned items suppressed when linked `Transaction` has `settlesPlannedItemId` + `settlesPlannedOccurrenceDate`
- [ ] Projected items appear in `ProjectionDay.items[]` with `isProjected: true`

---

## US-1.4 — Credit card accrual and statement payments

**Persona:** User

**Story:** As a user, I want **card purchases to accrue to statements** and **working cash to drop on due date** so the forecast matches Brazilian billing cycles.

**Priority:** P0  
**Depends on:** US-1.2

### Acceptance criteria

- [ ] Card expense on purchase date increases card liability (`Account.type === credit_card`); **does not** reduce working balance on purchase date
- [ ] Charges assign to statement by `closingDay` rule (see [000-initial-ideas.md §3.4](../ideas/000-initial-ideas.md))
- [ ] On statement `dueDate`, projected outflow from `defaultPayFromAccountId` (or override) reduces working balance
- [ ] `computedTotalCents` sums charges in period; `plannedPaymentCents` override supported per statement
- [ ] Opening debt: `anchorBalanceCents > 0` on card seeds first statement with `dueDate >= anchorDate`
- [ ] Settled statement (`paymentTransactionId` / `paysStatementId`) suppresses projected payment
- [ ] Fixture **credit-card-cycle** proves: purchase 27/06, closing 26, due 01 → working hit on 01/08

---

## US-1.5 — Installment plans in projection

**Persona:** User

**Story:** As a user, I want **installment due dates** to project as outflows until marked paid so that debt payoff is visible on the calendar.

**Priority:** P0  
**Depends on:** US-1.3

### Acceptance criteria

- [ ] Each `Installment` with `status === scheduled` and `isActive` plan projects on `dueDate`
- [ ] `status === paid` installments do not project
- [ ] Dormant plan (`isActive === false`) excluded until activated
- [ ] Paid installment linked via `settledTransactionId` suppresses projection
- [ ] Installment items in `ProjectionDay.items[]` use `source: "installment"`

---

## US-1.6 — Buffer, red-dot, and next negative date

**Persona:** User

**Story:** As a user, I want the engine to flag **days below my buffer** and compute **next negative date** so the calendar can warn me proactively.

**Priority:** P0  
**Depends on:** US-1.2, US-1.3, US-1.4, US-1.5

### Acceptance criteria

- [ ] `belowBuffer === true` when `closingBalanceCents < Settings.negativeBufferCents` (default 0)
- [ ] `nextNegativeDate` = first future day (≥ today) where `belowBuffer === true`, or `null`
- [ ] `largeOutflow === true` when `outflowsCents >= Settings.largeOutflowThresholdCents` and threshold &gt; 0
- [ ] Horizon rolls 24 months from `asOfDate`; days outside horizon not returned
- [ ] Full recompute on typical fixture set completes in &lt; 500 ms (manual or perf test)

---

## US-1.7 — Fixture library for key scenarios

**Persona:** Developer

**Story:** As a developer, I want **named fixture datasets** so that engine behavior is reproducible, documentable, and usable for UI demos without a database.

**Priority:** P0  
**Depends on:** US-1.1

### Acceptance criteria

- [ ] Fixtures live under `packages/engine/fixtures/` (JSON or JS modules)
- [ ] Minimum scenarios:

  | Fixture | Covers |
  |---|---|
  | `basic-salary-rent` | 2 working accounts, monthly income + expense, no cards |
  | `credit-card-cycle` | Closing 26 / due 01, purchase mid-cycle, opening debt |
  | `installment-plan` | 36× plan, mix of paid + scheduled |
  | `recurrence-overrides` | Skip + modify single occurrences |
  | `settlement-links` | Planned item + installment + statement settled |

- [ ] Each fixture validates against engine input schema (shape check or TypeScript)
- [ ] README in fixtures folder describes expected `nextNegativeDate` and key dates per fixture
- [ ] Fixtures derived from [001-data-model.md §7](../specs/001-data-model.md#7-worked-examples-spreadsheet--schema) worked examples where possible

---

## US-1.8 — Engine unit test suite

**Persona:** Developer

**Story:** As a developer, I want **automated tests per fixture and edge case** so that projection logic stays correct as features grow.

**Priority:** P0  
**Depends on:** US-1.6, US-1.7

### Acceptance criteria

- [ ] Tests run via `npm test` in engine package
- [ ] Each fixture has at least one test asserting `nextNegativeDate`, specific day balances, or item counts
- [ ] Explicit tests for:
  - Card purchase does not affect working balance on purchase date
  - Statement payment on due date
  - Re-anchor cutoff
  - Transfer between working accounts (net zero on aggregate)
  - Dormant / inactive exclusion
- [ ] Tests use fixed `asOfDate` for determinism

---

## US-1.9 — Storybook visualization of fixture projections

**Persona:** Developer / user (demo)

**Story:** As a developer, I want to **visualize fixture projections in Storybook** so that calendar semantics can be reviewed before the full app exists.

**Priority:** P1  
**Depends on:** US-1.7, US-0.3, [US-3.1](./03-calendar.md#us-31--year-calendar-grid)

### Acceptance criteria

- [ ] Storybook story (or stories) loads a fixture → calls `projectCashFlow` → renders a minimal month or year grid
- [ ] Red dots render from `belowBuffer` (not hardcoded)
- [ ] Story controls allow switching between fixtures (basic, credit-card, installments)
- [ ] Optional: day detail panel story showing `ProjectionDay.items[]` for a selected date
- [ ] Serves as living documentation for QA and future PRD acceptance demos
