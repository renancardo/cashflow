# Epic 4 — Transactions (ledger)

Actual transaction ledger replacing the spreadsheet “Lançamentos” tab.

**Status (2026-07-02):** The `/transactions` screen is implemented client-side — create/edit/delete, account and category links, instant filters (type pills + account/category/date), load-more pagination, and `EditorPanel`-based form. Data lives in an in-memory repo (`packages/db`); it resets on reload until persistent storage lands (ADR-006). Working balance in the header uses inclusive-through-today balances (`aggregateWorkingBalanceThrough`). Remaining gaps: manual list order + drag-and-drop (US-4.6), collapsible filter panel (US-4.7), shared segmented option control (US-4.8), settlement linking (US-4.4), bulk/CSV (US-4.5).

---

## US-4.1 — Log income, expense, and transfer

**Persona:** User

**Story:** As a user, I want to **record income, expenses, and transfers** so my ledger reflects what actually happened.

**Priority:** P0  
**Depends on:** US-2.1

### Acceptance criteria

- [x] Create/edit/delete transactions with: type, amount, account, category (except transfer), effective date, description — `TransactionEditorPanel`, `useTransactionMutations`, `transactionsRepo`
- [x] Transfer uses single row + `toAccountId` — editor shows from/to accounts; category hidden for transfers
- [x] Amounts stored as positive cents; type determines sign in engine — `toTransactionPayload()` enforces `Math.abs(amountCents)`
- [x] Changes trigger projection recompute — mutations invalidate `["accounts"]`, `["categories"]`, `["projection"]`

---

## US-4.2 — Filter and search transactions

**Persona:** User

**Story:** As a user, I want to **filter the ledger** by account, category, date range, and type so I can audit spending.

**Priority:** P0  
**Depends on:** US-4.1

### Acceptance criteria

- [x] Filters combine (AND); clear-all control — `transactionsRepo.query()`; dismissible active pills + “Clear all” in `TransactionsScreen`
- [x] Chronological list, newest first (fixed default documented) — `query()` sorts `effectiveDate` desc; toolbar notes “newest first”. Secondary `sortOrder` tie-breaker deferred to US-4.6
- [x] Empty filter result state — “No matching transactions” with clear-filters action
- [ ] Collapsible filter panel — detailed filters hidden by default; see US-4.7

---

## US-4.3 — Removed

---

## US-4.4 — Settle planned items from ledger

**Persona:** User

**Story:** As a user, I want to **link an actual transaction to a planned item** so forecast and ledger stay in sync.

**Priority:** P0  
**Depends on:** US-4.1, US-5.1, US-1.3

### Acceptance criteria

- [ ] Transaction can set `settlesPlannedItemId` + `settlesPlannedOccurrenceDate`
- [ ] Settled occurrence no longer projects
- [ ] UI: “mark as paid” from forecast or link from transaction form

---

## US-4.5 — Bulk entry and CSV import

**Persona:** User

**Story:** As a user, I want **bulk entry and CSV import** so onboarding isn’t one row at a time.

**Priority:** P4  
**Depends on:** US-4.1

### Acceptance criteria

- [ ] Multi-row inline form on Transactions screen
- [ ] CSV template: date, description, amount, account (minimal 4-column per scope)
- [ ] Import preview with validation errors before commit
- [ ] Imported rows create `Transaction` entities

---

## US-4.6 — Manual list order (drag and drop)

**Persona:** User

**Story:** As a user, I want to **reorder transactions within a day** so the ledger matches how I think about same-day entries (e.g. salary before rent on payday).

**Priority:** P1  
**Depends on:** US-4.1

### Data model

Add to `Transaction` ([001-data-model.md](../specs/001-data-model.md) §3.4):

| Field | Type | Notes |
|---|---|---|
| `sortOrder` | integer | Display order within the same `effectiveDate`. Lower = higher in the list when sorting newest-first. Default assigned on create (e.g. `max(sortOrder) + 1` for that date). |

**Sort rule (ledger list):** `effectiveDate` descending, then `sortOrder` ascending.

> Order is a **display** concern only — it does not change balances, projection, or category actuals. Engine continues to use `effectiveDate` for cash-flow timing.

### Acceptance criteria

- [ ] `sortOrder` on `Transaction` entity in `@cashflow/core`; persisted in `packages/db`
- [ ] New transactions get a default `sortOrder` for their `effectiveDate`
- [ ] List query sorts by `effectiveDate` desc, then `sortOrder` asc
- [ ] Drag-and-drop on `TransactionsScreen` rows updates `sortOrder` for affected transactions (same `effectiveDate` only — no implicit date change)
- [ ] Reorder persists via `transactionsRepo` update; list reflects new order without full reload
- [ ] Drag handle
- [ ] Filtered view: reorder applies to the transaction’s canonical order (not a view-local permutation)

---

## US-4.7 — Collapsible transaction filters

**Persona:** User

**Story:** As a user, I want **filters tucked away by default** so the ledger stays readable and I only expand filters when auditing.

**Priority:** P1  
**Depends on:** US-4.2

### UX

- **Collapsed (default):** type segmented control (US-4.8) + compact summary (e.g. “3 filters active” or “All transactions”) + toggle to expand
- **Expanded:** account, category, from/to date fields, active filter pills, and “Clear all” — same behaviour as today, no Apply button
- Toggle state is session-local (not persisted)
- On mobile, collapsed state is the default; expanded panel stacks fields vertically

### Acceptance criteria

- [ ] Filter card shows type control and expand/collapse affordance when collapsed
- [ ] Account, category, and date filters hidden until expanded
- [ ] Active filter count visible when collapsed and count > 0
- [ ] Expanding does not reset active filters
- [ ] `aria-expanded` on toggle; filter region labelled for screen readers

---

## US-4.8 — Segmented option control (shared UI)

**Persona:** Developer / User

**Story:** As a user, I want **consistent filter toggles** across screens so All / Expense / Income (Categories) and All types / Income / Expense / Transfer (Transactions) look and behave the same.

**Priority:** P1  
**Depends on:** US-0.2

### Design reference

Connected button group — bordered container, no gaps, active segment filled primary (see Categories toolbar and prototype). **Not** the standalone pill chips currently on Transactions type filters.

### Component

Extract a shared primitive in `packages/ui` (suggested name: `OptionInput` or `SegmentedControl`):

- Props: `options: { value, label }[]`, `value`, `onChange`, `aria-label`
- Single selection; keyboard navigation (arrow keys + roving tabindex)
- Storybook stories under **Molecules** — default, three options, four options, disabled option

### Acceptance criteria

- [ ] Shared component with module CSS matching Categories toolbar segmented style
- [ ] Storybook coverage for variants and interaction states
- [ ] `CategoriesScreen` kind filter (All / Expense / Income) migrated to shared component
- [ ] `TransactionsScreen` type filter migrated to shared component
- [ ] Exported from `packages/ui` index
- [ ] No duplicate `.chip` / `.typeChip` filter-button styles left in screen-level CSS after migration

---
