# Epic 5 — Forecast items

Planned income/expense, recurrence, subscriptions, and investment outflows.

**Status (2026-07-03):** The `/forecast` screen is implemented client-side — planned items and installment plans with create/edit/delete, `PlannedItemEditorPanel` / `InstallmentPlanEditorPanel`, type filters (including Subscriptions), active/dormant grouping, recurrence scope dialog (this / this+future), and “mark paid” settlement. Saves invalidate projection. Data lives in an in-memory repo (`packages/db`); it resets on reload until persistent storage lands (ADR-006). Remaining gaps: year calendar UI (US-3.1 — items project but are not shown on a grid), skip single occurrence UI (US-5.2), and credit-card subscription accrual via engine (US-5.3 / US-1.4).

---

## US-5.1 — Create planned income and expense

**Persona:** User

**Story:** As a user, I want to **add planned income and expenses** (one-off or recurring) so future cash flow is modeled.

**Priority:** P0  
**Depends on:** US-1.3, US-2.1

### Acceptance criteria

- [x] `PlannedItem` with type, amount, account, category, recurrence, start/end
- [x] Monthly recurrence uses `dayOfMonth`
- [x] One-off uses `recurrence: once` + `startDate`
- [ ] Items appear in projection and calendar after save

---

## US-5.2 — Edit recurrence with this / this+future scopes

**Persona:** User

**Story:** As a user, I want to **edit one occurrence or all future occurrences** of a recurring item so I can handle exceptions without breaking history.

**Priority:** P0  
**Depends on:** US-5.1

### Acceptance criteria

- [x] Dialog offers “This occurrence only” and “This and future” only (no “all”)
- [x] This occurrence → `PlannedItemOverride`
- [x] This and future → split rule (`endDate` on old + new `PlannedItem`)
- [ ] Delete single occurrence → override with `skipped`

---

## US-5.3 — Subscriptions filter

**Persona:** User

**Story:** As a user, I want to **tag and filter subscriptions** on Forecast Items so recurring card charges are easy to manage.

**Priority:** P1  
**Depends on:** US-5.1

### Acceptance criteria

- [x] `isSubscription` flag on `PlannedItem`
- [x] Filter chip on Forecast Items screen
- [ ] Subscriptions on credit card accrue via engine (US-1.4), not direct working hit

---

## US-5.4 — Dormant forecast items

**Persona:** User

**Story:** As a user, I want to **deactivate planned items** without deleting them so I can pause obligations.

**Priority:** P1  
**Depends on:** US-5.1

### Acceptance criteria

- [x] `isActive = false` excludes from projection
- [x] Dormant items visible in separate group/filter
- [x] Reactivation restores projection from recompute

---

## US-5.5 — Investment outflows as transfers

**Persona:** User

**Story:** As a user, I want to **schedule transfers to investment accounts** as planned items so capital moves affect working cash.

**Priority:** P1  
**Depends on:** US-5.1

### Acceptance criteria

- [x] Planned transfer: `accountId` (working) + `toAccountId` (investment)
- [x] Working balance decreases on effective date; no portfolio analytics in Phase 1
