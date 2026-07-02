# Epic 8 — Categories & budgets

Category management and monthly expense budgets.

---

## US-8.1 — Manage categories

**Persona:** User

**Story:** As a user, I want to **create and organize categories** so spending is classified consistently.

**Priority:** P0  
**Depends on:** US-4.1

### Acceptance criteria

- [ ] Expense and income categories; one-level parent/child max
- [ ] Archive category (soft delete) preserves historical transactions
- [ ] Categories used in transactions, planned items, and budgets

---

## US-8.2 — Set monthly category budgets

**Persona:** User

**Story:** As a user, I want to **set monthly budgets per expense category** so I can cap food, leisure, and other spending.

**Priority:** P0  
**Depends on:** US-8.1

### Acceptance criteria

- [ ] `CategoryBudget` with amount + `effectiveFromMonth`
- [ ] Expense categories only
- [ ] UI on Categories & Budgets screen

---

## US-8.3 — Track actual vs budget

**Persona:** User

**Story:** As a user, I want to **see current-month actual vs budget** with parent roll-up so I know if I’m over.

**Priority:** P0  
**Depends on:** US-8.2, US-4.1

### Acceptance criteria

- [ ] Progress bars and over/under amounts per category
- [ ] Parent category rolls up child spend
- [ ] When snapshot selected, variance also surfaced here (link to Epic 9)
