# Idea: Choose payment source when marking planned items paid

**Status:** consideration — not decided; does not supersede locked specs yet  
**Captured:** 2026-07-04  
**Related:** [001-data-model.md §3.5](../specs/001-data-model.md), [003-screen-specs.md §2.2](../specs/003-screen-specs.md), [05-forecast.md](../user-stories/05-forecast.md), [04-transactions.md](../user-stories/04-transactions.md), [06-credit-cards.md](../user-stories/06-credit-cards.md)

---

## Summary

Maybe **planned items should not require a source account upfront**. Instead, when the user clicks **Mark paid** (or **Mark as received**), a dialog asks **which account funded this payment**. The settlement transaction is then created with that chosen source:

| Chosen source | Effect |
|---|---|
| **Credit card** | Charge accrues to the card's statement cycle (same as a CC expense today) |
| **Working account** | Working balance is reduced immediately (same as a bank expense today) |

---

## Motivation

Today, `PlannedItem.accountId` is set at create/edit time and drives both **projection** (where the obligation appears in the forecast) and **settlement** (`settlePlannedItem` copies `accountId` onto the ledger transaction).

That coupling can feel wrong when:

- The user knows *what* they will pay (Netflix, rent, groceries) but not *how* they will pay it until the due date.
- The same recurring obligation might be paid from different accounts month to month (debit one month, credit card the next).
- Forecast setup forces an account choice before the user has decided payment method.

Deferring the source account to settlement time would separate **“I expect this expense”** from **“I paid it from here.”**

---

## Proposed UX (sketch)

1. **Planned item editor** — no source account field (or optional / “TBD” for projection-only hints).
2. **Mark paid** — opens a small modal:
   - Amount (pre-filled from occurrence; editable if overrides exist)
   - **Pay from:** account picker (working accounts + credit cards, filtered by type)
   - Confirm → create settlement `Transaction` with the selected `accountId`
3. **Projection behavior (TBD)** — open question: if no account is set on the template, how does the engine project the occurrence?
   - Option A: project as **account-agnostic** until settled (no working/CC impact until paid)
   - Option B: project a **generic outflow** on the due date without touching balances until source is known
   - Option C: keep optional `accountId` for projection defaults, but allow override at settlement

---

## Current behavior (for contrast)

- `PlannedItem.accountId` is required in the data model; CC subscriptions accrue to statements at projection time.
- `settlePlannedItem` in `packages/db/src/settlements/planned.ts` always uses `item.accountId` on the created transaction.
- Forecast and day-panel “mark paid” flows call settlement without an account picker.

---

## Open questions

- How do **credit card statement totals** project if the planned item has no card assigned until settlement?
- Do **transfers** (e.g. investment outflows) still need explicit `accountId` + `toAccountId` on the template?
- Should **installments** follow the same pattern, or only recurring/one-off planned items?
- Does this affect **working balance forecast accuracy** for users who always pay certain items from a card (statement lag vs immediate drain)?

---

## If adopted later

- Amend `001-data-model.md` (`PlannedItem.accountId` optional or projection-only).
- Update settlement API: `settlePlannedItem(..., { accountId })` or equivalent.
- Add user stories for account picker on mark-paid (Forecast, day panel, calendar).
- Revisit projection engine rules for account-less planned occurrences.
