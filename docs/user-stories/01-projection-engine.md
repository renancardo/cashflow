# Epic 1 — Projection engine & fixtures

Pure JavaScript cash-flow projection engine with **fixture datasets** and automated tests. **Build early** — calendar and most screens consume `ProjectionResult`.

> **Contract:** Input/output types must match [001-data-model.md §6](../specs/001-data-model.md#6-derived-types-projection-engine-output).

## Implementation status (2026-07-02)

| Story | Status | Notes |
|---|---|---|
| US-1.1 | **Done** | `projectCashFlow` exported from `packages/engine` |
| US-1.2 | **Done** | `accounts.ts`, transaction legs in `events.ts` |
| US-1.3 | **Done** | Recurrence expansion + overrides in `events.ts`; `clampDayOfMonth` in `dates.ts` |
| US-1.4 | **Partial** | Statement **payments** projected from materialized rows; dynamic cycle assignment / opening-debt seeding deferred (see notes below) |
| US-1.5 | **Done** | Scheduled installments from active plans |
| US-1.6 | **Done** | Buffer, large-outflow, horizon, perf test on `household-june-2026` |
| US-1.7 | **Done** | Six fixtures + `fixtures/README.md` |
| US-1.8 | **Done** | 32 tests — `project.test.ts`, `edge-cases.test.ts`, `fixtures.test.ts` |
| US-1.9 | **Not started** | Blocked on calendar organisms ([US-3.1](./03-calendar.md#us-31--year-calendar-grid)) |

**Engine layout:** `packages/engine/src/{project,dates,accounts,settlements,events}.ts`

**Card-cycle note:** Per [001-data-model.md §8.4](../specs/001-data-model.md#84-statement-materialization--whole-24-month-horizon-per-card), `CreditCardStatement` rows are **materialized inputs**. `projectCashFlow` projects due-date payments from `computedTotalCents` / `plannedPaymentCents`; it does not yet derive statements from `closingDay` or seed opening debt from card anchors (that belongs in the data/materialization layer).

---

## US-1.1 — Define engine input/output contract

**Persona:** Developer

**Story:** As a developer, I want a **typed engine contract** (`EngineInput` → `ProjectionResult`) so that UI, tests, and fixtures share one API.

**Priority:** P0  
**Depends on:** US-0.2

### Acceptance criteria

- [x] `projectCashFlow(input, asOfDate?)` (or equivalent) exported from `packages/engine`
- [x] Input includes: `accounts`, `transactions`, `plannedItems`, `plannedItemOverrides`, `creditCardStatements`, `installments`, `installmentPlans`, `settings`
- [x] Output matches `ProjectionResult`: `days[]`, `nextNegativeDate`, `workingBalanceTodayCents`
- [x] Each `ProjectionDay` includes: `date`, `openingBalanceCents`, `closingBalanceCents`, `inflowsCents`, `outflowsCents`, `belowBuffer`, `largeOutflow`, `items[]`
- [x] Money is **integer cents** throughout; no floats in engine internals

---

## US-1.2 — Daily working balance from anchors and actuals

**Persona:** User (via calendar)

**Story:** As a user, I want the engine to **compute daily aggregate working balance** from account anchors and actual transactions so that past days reflect real cash on hand.

**Priority:** P0  
**Depends on:** US-1.1

### Acceptance criteria

- [x] Only accounts with `isWorking === true` contribute to aggregate working balance
- [x] Per-account balance forward from `anchorBalanceCents` + `anchorDate` using transactions with `effectiveDate >= anchorDate`
- [x] Income increases working balance; expense decreases; transfer debits source and credits destination (single-row model)
- [x] Re-anchoring: transactions before new `anchorDate` do not affect balance for that account
- [x] `workingBalanceTodayCents` equals closing balance on `asOfDate` (default today)

---

## US-1.3 — Expand planned items and recurrence

**Persona:** User

**Story:** As a user, I want **recurring and one-off planned items** to appear on the correct future dates so that salary, rent, and subscriptions show in the forecast.

**Priority:** P0  
**Depends on:** US-1.2

### Acceptance criteria

- [x] Recurrence modes: `once`, `weekly`, `monthly`, `yearly` within `Settings.horizonMonths` (default 24)
- [x] Monthly items respect `dayOfMonth` (clamp/end-of-month rule documented — see `clampDayOfMonth` in `packages/engine/src/dates.ts`)
- [x] `PlannedItemOverride` with `skipped` suppresses an occurrence; `modified` overrides amount/date
- [x] `isActive === false` items excluded from projection
- [x] Settled planned items suppressed when linked `Transaction` has `settlesPlannedItemId` + `settlesPlannedOccurrenceDate`
- [x] Projected items appear in `ProjectionDay.items[]` with `isProjected: true`

---

## US-1.4 — Credit card accrual and statement payments

**Persona:** User

**Story:** As a user, I want **card purchases to accrue to statements** and **working cash to drop on due date** so the forecast matches Brazilian billing cycles.

**Priority:** P0  
**Depends on:** US-1.2

### Acceptance criteria

- [x] Card expense on purchase date increases card liability (`Account.type === credit_card`); **does not** reduce working balance on purchase date
- [ ] Charges assign to statement by `closingDay` rule (see [000-initial-ideas.md §3.4](../ideas/000-initial-ideas.md)) — **deferred:** engine consumes materialized `CreditCardStatement` rows; assignment is a separate materialization step
- [x] On statement `dueDate`, projected outflow from `defaultPayFromAccountId` (or override) reduces working balance
- [x] `computedTotalCents` sums charges in period; `plannedPaymentCents` override supported per statement
- [ ] Opening debt: `anchorBalanceCents > 0` on card seeds first statement with `dueDate >= anchorDate` — **deferred:** seeded in fixtures / future data layer
- [x] Settled statement (`paymentTransactionId` / `paysStatementId`) suppresses projected payment
- [x] Fixture **credit-card-cycle** proves: purchase 27/06, closing 26, due 01 → working hit on 01/08

---

## US-1.5 — Installment plans in projection

**Persona:** User

**Story:** As a user, I want **installment due dates** to project as outflows until marked paid so that debt payoff is visible on the calendar.

**Priority:** P0  
**Depends on:** US-1.3

### Acceptance criteria

- [x] Each `Installment` with `status === scheduled` and `isActive` plan projects on `dueDate`
- [x] `status === paid` installments do not project
- [x] Dormant plan (`isActive === false`) excluded until activated
- [x] Paid installment linked via `settledTransactionId` suppresses projection
- [x] Installment items in `ProjectionDay.items[]` use `source: "installment"`

---

## US-1.6 — Buffer, red-dot, and next negative date

**Persona:** User

**Story:** As a user, I want the engine to flag **days below my buffer** and compute **next negative date** so the calendar can warn me proactively.

**Priority:** P0  
**Depends on:** US-1.2, US-1.3, US-1.4, US-1.5

### Acceptance criteria

- [x] `belowBuffer === true` when `closingBalanceCents < Settings.negativeBufferCents` (default 0)
- [x] `nextNegativeDate` = first day (≥ `asOfDate`) where `belowBuffer === true`, or `null`
- [x] `largeOutflow === true` when `outflowsCents >= Settings.largeOutflowThresholdCents` and threshold &gt; 0
- [x] Horizon rolls 24 months from `asOfDate`; days outside horizon not returned
- [x] Full recompute on typical fixture set completes in &lt; 500 ms (manual or perf test)

---

## US-1.7 — Fixture library for key scenarios

**Persona:** Developer

**Story:** As a developer, I want **named fixture datasets** so that engine behavior is reproducible, documentable, and usable for UI demos without a database.

**Priority:** P0  
**Depends on:** US-1.1

### Acceptance criteria

- [x] Fixtures live under `packages/engine/fixtures/` (JSON or JS modules)
- [x] Minimum scenarios:

  | Fixture | Covers |
  |---|---|
  | `basic-salary-rent` | One working account, monthly income + expense, no cards |
  | `credit-card-cycle` | Closing 26 / due 01, purchase mid-cycle, opening debt |
  | `installment-plan` | 36× plan, mix of paid + scheduled |
  | `recurrence-overrides` | Skip + modify single occurrences |
  | `settlement-links` | Planned item + installment + statement settled |
  | `household-june-2026` | *(bonus)* Rich multi-account household scenario |

- [x] Each fixture validates against engine input schema (shape check or TypeScript)
- [x] README in fixtures folder describes expected `nextNegativeDate` and key dates per fixture
- [x] Fixtures derived from [001-data-model.md §7](../specs/001-data-model.md#7-worked-examples-spreadsheet--schema) worked examples where possible

---

## US-1.8 — Engine unit test suite

**Persona:** Developer

**Story:** As a developer, I want **automated tests per fixture and edge case** so that projection logic stays correct as features grow.

**Priority:** P0  
**Depends on:** US-1.6, US-1.7

### Acceptance criteria

- [x] Tests run via `npm test` in engine package
- [x] Each fixture has at least one test asserting `nextNegativeDate`, specific day balances, or item counts
- [x] Explicit tests for:
  - Card purchase does not affect working balance on purchase date
  - Statement payment on due date
  - Re-anchor cutoff
  - Transfer between working accounts (net zero on aggregate)
  - Dormant / inactive exclusion
- [x] Tests use fixed `asOfDate` for determinism

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
