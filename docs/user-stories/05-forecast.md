# Epic 5 — Forecast items

Planned income/expense, recurrence, subscriptions, and investment outflows.

---

## US-5.1 — Create planned income and expense

**Persona:** User

**Story:** As a user, I want to **add planned income and expenses** (one-off or recurring) so future cash flow is modeled.

**Priority:** P0  
**Depends on:** US-1.3, US-2.1

### Acceptance criteria

- [ ] `PlannedItem` with type, amount, account, category, recurrence, start/end
- [ ] Monthly recurrence uses `dayOfMonth`
- [ ] One-off uses `recurrence: once` + `startDate`
- [ ] Items appear in projection and calendar after save

---

## US-5.2 — Edit recurrence with this / this+future scopes

**Persona:** User

**Story:** As a user, I want to **edit one occurrence or all future occurrences** of a recurring item so I can handle exceptions without breaking history.

**Priority:** P0  
**Depends on:** US-5.1

### Acceptance criteria

- [ ] Dialog offers “This occurrence only” and “This and future” only (no “all”)
- [ ] This occurrence → `PlannedItemOverride`
- [ ] This and future → split rule (`endDate` on old + new `PlannedItem`)
- [ ] Delete single occurrence → override with `skipped`

---

## US-5.3 — Subscriptions filter

**Persona:** User

**Story:** As a user, I want to **tag and filter subscriptions** on Forecast Items so recurring card charges are easy to manage.

**Priority:** P1  
**Depends on:** US-5.1

### Acceptance criteria

- [ ] `isSubscription` flag on `PlannedItem`
- [ ] Filter chip on Forecast Items screen
- [ ] Subscriptions on credit card accrue via engine (US-1.4), not direct working hit

---

## US-5.4 — Dormant forecast items

**Persona:** User

**Story:** As a user, I want to **deactivate planned items** without deleting them so I can pause obligations.

**Priority:** P1  
**Depends on:** US-5.1

### Acceptance criteria

- [ ] `isActive = false` excludes from projection
- [ ] Dormant items visible in separate group/filter
- [ ] Reactivation restores projection from recompute

---

## US-5.5 — Investment outflows as transfers

**Persona:** User

**Story:** As a user, I want to **schedule transfers to investment accounts** as planned items so capital moves affect working cash.

**Priority:** P1  
**Depends on:** US-5.1

### Acceptance criteria

- [ ] Planned transfer: `accountId` (working) + `toAccountId` (investment)
- [ ] Working balance decreases on effective date; no portfolio analytics in Phase 1
