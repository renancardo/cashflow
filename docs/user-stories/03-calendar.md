# Epic 3 — Calendar

Year and month calendar views driven by real engine output.

---

## US-3.1 — Year calendar grid

**Persona:** User

**Story:** As a user, I want a **linear year calendar** (months as rows, weekdays as columns) so I can scan cash-flow risk across the whole year.

**Priority:** P0  
**Depends on:** US-1.6, US-0.3

### Acceptance criteria

- [ ] Layout matches [004-style-guide.md](../specs/004-style-guide.md) and `docs/prototype/004/`
- [ ] Weekend columns subtly shaded
- [ ] Horizontal scroll through year; “jump to today” control
- [ ] Each cell shows day number; data from `ProjectionResult.days`

---

## US-3.2 — Red dots and day indicators

**Persona:** User

**Story:** As a user, I want **red dots on risky days** and subtle indicators for income, large outflows, and card due dates so important days stand out.

**Priority:** P0  
**Depends on:** US-3.1, US-1.6

### Acceptance criteria

- [ ] Red dot when `ProjectionDay.belowBuffer === true`
- [ ] Green indicator for days with net income (per style guide)
- [ ] Amber indicator when `largeOutflow === true`
- [ ] Optional marker for statement due dates
- [ ] Indicators driven by engine — not hardcoded mock data

---

## US-3.3 — Calendar header metrics

**Persona:** User

**Story:** As a user, I want the **header to show working balance and next negative date** so I get the north-star answer without a separate dashboard.

**Priority:** P0  
**Depends on:** US-1.6, US-3.1

### Acceptance criteria

- [ ] Displays `workingBalanceTodayCents` formatted per locale
- [ ] Displays `nextNegativeDate` or “no risk in horizon”
- [ ] Alert badge when `nextNegativeDate` is within `Settings.alertLeadTimeDays`
- [ ] Header visible on Year and Month calendar screens

---

## US-3.4 — Month calendar view

**Persona:** User

**Story:** As a user, I want a **month view** with denser detail so I can review and edit a single month’s cash flow.

**Priority:** P0  
**Depends on:** US-3.1

### Acceptance criteria

- [ ] Same weekday column layout as year view, single month
- [ ] Day cells show entry lines with actual vs projected colors per [003-screen-specs.md §2.6](../specs/003-screen-specs.md)
- [ ] Toggle navigation between year and month views
- [ ] Same red-dot and indicator semantics as year view

---

## US-3.5 — Day detail panel

**Persona:** User

**Story:** As a user, I want to **click a day** and see balance breakdown plus all items affecting that day so I understand why a day is red.

**Priority:** P0  
**Depends on:** US-3.1

### Acceptance criteria

- [ ] Slide-over panel from year or month calendar
- [ ] Shows opening/closing balance, inflows, outflows, item list from `ProjectionDay`
- [ ] Distinguishes actual vs projected items
- [ ] Quick-add entry points (income / expense / transfer) with day pre-filled

---

## US-3.6 — Quick-add from day panel

**Persona:** User

**Story:** As a user, I want to **add a transaction or planned item from the day panel** so I don’t leave the calendar context.

**Priority:** P1  
**Depends on:** US-3.5, US-4.1, US-5.1

### Acceptance criteria

- [ ] Compact form per [003-screen-specs.md §2.3](../specs/003-screen-specs.md)
- [ ] Successful save triggers projection recompute and panel refresh
- [ ] Validation prevents invalid transfer to credit card (except statement flow)

---

## US-3.7 — Calendar keyboard navigation (baseline)

**Persona:** User

**Story:** As a user, I want **basic keyboard navigation** on the calendar grid so the app is usable without a mouse.

**Priority:** P2  
**Depends on:** US-3.1

### Acceptance criteria

- [ ] Arrow keys move focus between day cells
- [ ] Enter opens day detail panel
- [ ] Focus visible per style guide
- [ ] Full WCAG audit deferred; baseline only per scope NFR
