# Epic 8 — Categories & budgets

Category management and monthly expense budgets.

**Status (2026-07-02):** The `/categories` screen is implemented client-side — list with expense budgets and income rows, create/edit/archive, monthly budget editor, actual-vs-budget with parent roll-up, month filter, and Storybook coverage. Data lives in an in-memory repo (`packages/db`); it resets on reload until persistent storage lands (ADR-006). Remaining gaps: snapshot variance overlay (Epic 9), transaction/forecast entry UIs that assign categories (Epics 4–5).

---

## US-8.1 — Manage categories

**Persona:** User

**Story:** As a user, I want to **create and organize categories** so spending is classified consistently.

**Priority:** P0  
**Depends on:** US-4.1

### Acceptance criteria

- [x] Expense and income categories; one-level parent/child max — `CategoryEditorPanel` kind + parent select; root-only `parentOptions` from `CategoriesPage`
- [x] Archive category (soft delete) preserves historical transactions — `categoriesRepo.archive()` sets `archivedAt`; archived cats hidden from list; editor tooltip notes history is preserved
- [x] Categories used in transactions, planned items, and budgets — `categoryId` on all three entities; budgets fully wired in UI; transaction/forecast entry screens not built yet (Epics 4–5)

---

## US-8.2 — Set monthly category budgets

**Persona:** User

**Story:** As a user, I want to **set monthly budgets per expense category** so I can cap food, leisure, and other spending.

**Priority:** P0  
**Depends on:** US-8.1

### Acceptance criteria

- [x] `CategoryBudget` with amount + `effectiveFromMonth` — core entity + `categoryBudgetsRepo.upsertForMonth()`; editor month field
- [x] Expense categories only — budget section hidden for income; `upsertBudget` / `removeBudget` gated on `kind === "expense"`
- [x] UI on Categories & Budgets screen — `CategoriesScreen`, `CategoriesPage`, `/categories` route, nav link, Storybook stories

---

## US-8.3 — Track actual vs budget

**Persona:** User

**Story:** As a user, I want to **see current-month actual vs budget** with parent roll-up so I know if I’m over.

**Priority:** P0  
**Depends on:** US-8.2, US-4.1

### Acceptance criteria

- [x] Progress bars and over/under amounts per category — per-row `ProgressBar`, variance column, summary-strip budget progress
- [x] Parent category rolls up child spend — `useCategories` `buildRows()` sums child actuals/budgets into parent row
- [ ] When snapshot selected, variance also surfaced here (Epic 9 — **Phase 2**; not in v1)
