# Epic 2 — Accounts

Account setup, working flags, anchoring, and credit card cycle configuration.

**Status (2026-07-02):** The `/accounts` screen is largely implemented client-side — list, create/edit/archive, working-balance summary, and engine-derived balances. Data lives in an in-memory repo (`packages/db`); it resets on reload until persistent storage lands (ADR-006). Remaining gaps: anchor date in the list, per-type form validation, re-anchor UX, credit card statement materialization on save, and next close/due dates in the UI.

---

## US-2.1 — Create and list accounts

**Persona:** User

**Story:** As a user, I want to **create accounts** of different types so I can model where my money lives.

**Priority:** P0  
**Depends on:** US-0.2, US-1.1

### Acceptance criteria

- [x] Support types: `checking`, `savings`, `wallet`, `credit_card`, `investment`
- [ ] Accounts list shows name, type, current derived balance, anchor date — anchor date is in row data but not rendered in `AccountRow` yet
- [ ] Create/edit form validates required fields per type — only `name` is required today; credit card `closingDay` / `dueDay` not enforced
- [x] Archived accounts hidden from default list but preserved in history — `accountsRepo.archive()` sets `archivedAt`; no UI to browse or restore archived accounts

---

## US-2.2 — Working account flag

**Persona:** User

**Story:** As a user, I want to **toggle “include in working accounts”** per account so the projection only counts spendable cash.

**Priority:** P0  
**Depends on:** US-2.1

### Acceptance criteria

- [x] `isWorking` toggle on account edit; credit cards and investment accounts default off — list row still allows toggling investments (editor locks both card and investment)
- [x] Toggling triggers projection recompute; calendar header working balance updates — mutations invalidate `["projection"]`; calendar stub shows `workingBalanceTodayCents`
- [x] Working balance in header = sum of working account balances as of today (matches engine)

---

## US-2.3 — Balance anchor and re-anchor

**Persona:** User

**Story:** As a user, I want to **set and update opening balance + anchor date** so projections start from a known truth and I can reconcile drift.

**Priority:** P0  
**Depends on:** US-2.1, US-1.2

### Acceptance criteria

- [x] Account stores `anchorBalanceCents` + `anchorDate`
- [ ] Re-anchor action updates both fields with confirmation copy explaining cutoff behavior — anchor fields are plain edit fields; no dedicated re-anchor flow
- [x] After re-anchor, engine ignores pre-anchor transactions for that account’s balance
- [x] Credit card anchor uses positive = amount owed convention

---

## US-2.4 — Credit card cycle configuration

**Persona:** User

**Story:** As a user, I want to **configure closing day, due day, and default pay-from account** on credit cards so statement payments project correctly.

**Priority:** P0  
**Depends on:** US-2.1, US-1.4

### Acceptance criteria

- [x] Fields: `closingDay`, `dueDay`, `defaultPayFromAccountId` (working account)
- [ ] Saving card config materializes statements within horizon (engine or data layer) — `CreditCardStatement` entity exists but account mutations do not populate it
- [ ] UI shows next statement close and due dates

---

## US-2.5 — Accounts empty and error states

**Persona:** User

**Story:** As a new user, I want **clear empty states** on Accounts so I know to add accounts before forecasting.

**Priority:** P1  
**Depends on:** US-2.1

### Acceptance criteria

- [x] Empty state CTA: add first account
- [x] Loading and error states per [003-screen-specs.md §7](../specs/003-screen-specs.md)
- [x] Prominent **working balance** summary when ≥1 working account exists
