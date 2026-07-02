# Epic 7 — Installments

Finite debt schedules and payoff visibility.

---

## US-7.1 — Create installment plan

**Persona:** User

**Story:** As a user, I want to **create an installment plan** with count, amount, and first due date so payments project automatically.

**Priority:** P0  
**Depends on:** US-1.5, US-5.1

### Acceptance criteria

- [ ] `InstallmentPlan` + eager `Installment` rows on save
- [ ] Shows computed payoff date (last installment)
- [ ] Managed in Forecast Items → Installments group (no separate screen)

---

## US-7.2 — Mark installment paid

**Persona:** User

**Story:** As a user, I want to **mark an installment as paid** so future projections stop for that payment.

**Priority:** P0  
**Depends on:** US-7.1, US-4.4

### Acceptance criteria

- [ ] Set `Installment.status = paid` + optional `settledTransactionId`
- [ ] Paid installments excluded from projection
- [ ] Cannot reduce installment count below highest paid index

---

## US-7.3 — Payoff timeline visibility

**Persona:** User

**Story:** As a user, I want to **see when each debt ends** on Forecast Items or calendar so I know when cash flow will ease.

**Priority:** P1  
**Depends on:** US-7.1

### Acceptance criteria

- [ ] Plan list shows payoff date
- [ ] Optional calendar marker on last installment date
- [ ] Dormant plans shown but excluded until activated
