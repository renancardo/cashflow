# Epic 4 — Transactions (ledger)

Actual transaction ledger replacing the spreadsheet “Lançamentos” tab.

---

## US-4.1 — Log income, expense, and transfer

**Persona:** User

**Story:** As a user, I want to **record income, expenses, and transfers** so my ledger reflects what actually happened.

**Priority:** P0  
**Depends on:** US-2.1

### Acceptance criteria

- [ ] Create/edit/delete transactions with: type, amount, account, category (except transfer), effective date, description
- [ ] Transfer uses single row + `toAccountId`
- [ ] Amounts stored as positive cents; type determines sign in engine
- [ ] Changes trigger projection recompute

---

## US-4.2 — Filter and search transactions

**Persona:** User

**Story:** As a user, I want to **filter the ledger** by account, category, date range, and type so I can audit spending.

**Priority:** P0  
**Depends on:** US-4.1

### Acceptance criteria

- [ ] Filters combine (AND); clear-all control
- [ ] Chronological list, newest or oldest first (user preference or fixed default documented)
- [ ] Empty filter result state

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
