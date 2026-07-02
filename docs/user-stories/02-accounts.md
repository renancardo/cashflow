# Epic 2 — Accounts

Account setup, working flags, anchoring, and credit card cycle configuration.

---

## US-2.1 — Create and list accounts

**Persona:** User

**Story:** As a user, I want to **create accounts** of different types so I can model where my money lives.

**Priority:** P0  
**Depends on:** US-0.2, US-1.1

### Acceptance criteria

- [ ] Support types: `checking`, `savings`, `wallet`, `credit_card`, `investment`
- [ ] Accounts list shows name, type, current derived balance, anchor date
- [ ] Create/edit form validates required fields per type
- [ ] Archived accounts hidden from default list but preserved in history

---

## US-2.2 — Working account flag

**Persona:** User

**Story:** As a user, I want to **toggle “include in working accounts”** per account so the projection only counts spendable cash.

**Priority:** P0  
**Depends on:** US-2.1

### Acceptance criteria

- [ ] `isWorking` toggle on account edit; credit cards and investment accounts default off
- [ ] Toggling triggers projection recompute; calendar header working balance updates
- [ ] Working balance in header = sum of working account balances as of today (matches engine)

---

## US-2.3 — Balance anchor and re-anchor

**Persona:** User

**Story:** As a user, I want to **set and update opening balance + anchor date** so projections start from a known truth and I can reconcile drift.

**Priority:** P0  
**Depends on:** US-2.1, US-1.2

### Acceptance criteria

- [ ] Account stores `anchorBalanceCents` + `anchorDate`
- [ ] Re-anchor action updates both fields with confirmation copy explaining cutoff behavior
- [ ] After re-anchor, engine ignores pre-anchor transactions for that account’s balance
- [ ] Credit card anchor uses positive = amount owed convention

---

## US-2.4 — Credit card cycle configuration

**Persona:** User

**Story:** As a user, I want to **configure closing day, due day, and default pay-from account** on credit cards so statement payments project correctly.

**Priority:** P0  
**Depends on:** US-2.1, US-1.4

### Acceptance criteria

- [ ] Fields: `closingDay`, `dueDay`, `defaultPayFromAccountId` (working account)
- [ ] Saving card config materializes statements within horizon (engine or data layer)
- [ ] UI shows next statement close and due dates

---

## US-2.5 — Accounts empty and error states

**Persona:** User

**Story:** As a new user, I want **clear empty states** on Accounts so I know to add accounts before forecasting.

**Priority:** P1  
**Depends on:** US-2.1

### Acceptance criteria

- [ ] Empty state CTA: add first account
- [ ] Loading and error states per [003-screen-specs.md §7](../specs/003-screen-specs.md)
- [ ] Prominent **working balance** summary when ≥1 working account exists
