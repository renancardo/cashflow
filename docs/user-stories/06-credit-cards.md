# Epic 6 — Credit cards (UI & statements)

User-facing credit card flows beyond engine logic.

---

## US-6.1 — View statement list and totals

**Persona:** User

**Story:** As a user, I want to **see upcoming statements** per card with computed totals so I know what’s due and when.

**Priority:** P0  
**Depends on:** US-2.4, US-1.4

### Acceptance criteria

- [ ] List statements in horizon with closing date, due date, computed total
- [ ] Show `plannedPaymentCents` override when set
- [ ] Paid statements linked to payment transaction

---

## US-6.2 — Override statement payment amount

**Persona:** User

**Story:** As a user, I want to **edit the projected payment** for a statement so partial payments are reflected.

**Priority:** P0  
**Depends on:** US-6.1

### Acceptance criteria

- [ ] Edit `plannedPaymentCents` per statement occurrence
- [ ] Engine uses override instead of full `computedTotalCents` for working outflow
- [ ] Reset to auto-computed full balance

---

## US-6.3 — Pay statement from ledger

**Persona:** User

**Story:** As a user, I want to **record a statement payment** as a transfer that settles the statement so actual matches projection.

**Priority:** P0  
**Depends on:** US-6.1, US-4.1

### Acceptance criteria

- [ ] Payment creates transfer from working account with `paysStatementId`
- [ ] Sets `CreditCardStatement.paymentTransactionId`
- [ ] Suppresses projected payment for that due date

---

## US-6.4 — Onboard card with existing debt

**Persona:** User

**Story:** As a user, I want **existing fatura balance** to appear on the next due date when I add a card so I don’t start from zero.

**Priority:** P0  
**Depends on:** US-2.3, US-1.4

### Acceptance criteria

- [ ] Card anchor with positive owed balance seeds first due statement
- [ ] Calendar shows working outflow on that due date in projection
- [ ] Covered by `credit-card-cycle` fixture and engine tests
