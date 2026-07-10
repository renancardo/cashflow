# Idea: Unsettled planned occurrences (missed income & overdue bills)

**Status:** implemented (2026-07-10) — engine `isOverdue`, month entry colors, year/month overdue bars, day-panel settle  
**Captured:** 2026-07-07 (from time-travel QA)  
**Related:** [003-screen-specs.md §2.6](../specs/003-screen-specs.md), [05-forecast.md](../user-stories/05-forecast.md) (US-5.6), [03-calendar.md](../user-stories/03-calendar.md) (US-3.12), [04-transactions.md](../user-stories/04-transactions.md), [US-3.9](../user-stories/03-calendar.md#us-39--mark-paid--received-from-day-panel)

---

## Problem

When simulated (or real) **today** moves past a planned occurrence date and the user has **not** marked it paid/received:

| Type | Example | User question |
|---|---|---|
| **Income** | Salary expected on the 5th, received on the 12th | Should the expected inflow stay on the 5th? Roll forward? How do I record late receipt? |
| **Expense** | Rent due on the 10th, paid on the 15th | How do I see that the bill is overdue? What happens to projection until I pay? |

Today the engine still emits the occurrence on its **original** date, but once `effectiveDate < asOfDate` it sets `isProjected: false` even when **unsettled** (`packages/engine/src/events.ts`). That makes missed items look like actuals in the month calendar color rules and **blocks** the past-due styling defined in [003-screen-specs.md §2.6](../specs/003-screen-specs.md).

---

## Design principles (proposal)

1. **Occurrence date is canonical** — `settlesPlannedOccurrenceDate` always refers to the scheduled occurrence, even if cash moved on a different day.
2. **Unsettled ≠ actual** — ledger and projection must distinguish *scheduled*, *settled*, and *overdue/missed*.
3. **No silent auto-roll** — do not move unpaid bills or unreceived income to “today” without an explicit user action (override, settle, or skip).
4. **Projection honesty** — until settled, an overdue **expense** should not pretend the outflow already happened; an overdue **income** should not inflate working balance as if received.

---

## Income — options

| Option | Behavior | Pros | Cons |
|---|---|---|---|
| **A — Sticky expected** | Keep projected income on original date; show “missed / awaiting” state after due date | Clear audit trail; matches “I was supposed to be paid on the 5th” | Working balance may look low until user acts |
| **B — Auto-roll to today** | Unsettled income re-projects on `asOfDate` until received | Balance feels “current” | Hides lateness; double-count risk if user also adds manual tx |
| **C — User reschedule** | `PlannedItemOverride.dateOverride` moves expectation to a new date | Explicit, matches real-world delay | Extra UI; need day-panel / forecast action |
| **D — Late receipt only (recommended baseline)** | User settles when money arrives: `Transaction.effectiveDate` = receipt day, `settlesPlannedOccurrenceDate` = original schedule | Matches bank reality; no schema change | Requires clear UI on original occurrence day (“received late on …”) |

**Recommendation:** **A + D** — show missed income on the scheduled day with a distinct visual (e.g. amber “awaiting” on month entries; optional year-view dot), and **Confirm receipt** creates the actual on the receipt date with settlement link to the occurrence. Optional **C** via existing override flow.

**Open questions**

- Should missed income still affect `workingBalanceTodayCents` after the due date? (Likely **no** until settled.)
- Forecast “next” row: show overdue occurrence or jump to next month?

---

## Expense — options

| Option | Behavior | Pros | Cons |
|---|---|---|---|
| **A — Past-due indicator only** | Keep on original date; red styling + badge when `unsettled && effectiveDate < today` | Matches user intuition (“bill is late”) | Needs engine `isSettled` / `isProjected` fix |
| **B — Overdue roll-up** | Aggregate overdue outflows in header (“2 bills overdue”) | High visibility | New summary UI |
| **C — Reschedule / skip** | Override date or `skipped` status per occurrence | Handles “paid next week” / “skipped this month” | Depends on US-5.2 skip UI |
| **D — Late payment settle** | Same as income: pay on actual date, link to occurrence | Already aligned with §2.2 settlement | Day-panel settle wired (US-3.9) |

**Recommendation:** **A + D + C** — implement [003-screen-specs.md §2.6](../specs/003-screen-specs.md) past-due red on month calendar entry lines; add year-view **overdue** dot. Day-panel settle is wired (US-3.9); remaining work is engine `isProjected` / overdue styling. User’s red-indicator idea fits **A** (already spec’d, not fully wired).

**Open questions**

- Do overdue projected expenses still reduce future-day balances, or only flag on the due date?
- Credit-card subscriptions: overdue = statement accrual vs working outflow — follow card cycle rules (US-1.4).

---

## Engine / model sketch

```
ProjectionItem {
  ...
  isProjected: boolean      // true while unsettled
  isSettled: boolean        // from settlement index
  occurrenceDate: string    // canonical schedule (may differ from effectiveDate on day)
  effectiveDate: string     // date shown on calendar row
  status?: "scheduled" | "overdue" | "settled"  // derived for UI
}
```

Derivation:

```
unsettled = !isSettled
overdue = unsettled && effectiveDate < asOfDate
past-due UI = overdue && type !== "income"   // expenses
awaiting UI = overdue && type === "income"
```

---

## Suggested backlog

| ID | Title | Epic | Status |
|---|---|---|---|
| US-5.6 | Missed income & late receipt | Forecast | **Done** (core; optional “received on” display deferred) |
| US-3.12 | Overdue bill indicators | Calendar | **Done** (core; optional Forecast badge deferred) |

US-3.9 (day-panel settle) is **done** — see [03-calendar.md](../user-stories/03-calendar.md#us-39--mark-paid--received-from-day-panel).

---

## QA scenarios (after implementation)

1. Fast-forward past salary day without settling → month cell shows awaiting income; working balance does not include salary.
2. Confirm receipt on a later day → transaction on receipt date; occurrence marked settled; balance updates.
3. Fast-forward past rent day without paying → month entry red past-due; year dot optional.
4. Mark paid on late date → outflow on payment date; occurrence settled; past-due styling clears.
