# Epic 9 — Snapshots & variance

Baseline forecast capture and comparison to actuals.

**Status:** Deferred to **Phase 2** (removed from v1 scope). Prototype reference: `docs/prototype/004/snapshots.html`.

---

## US-9.1 — Create baseline snapshot

**Persona:** User

**Story:** As a user, I want to **save a named snapshot** of my forecast so I can compare what I planned vs what happened.

**Priority:** Phase 2  
**Depends on:** US-1.6, US-5.1

### Acceptance criteria

- [ ] Snapshot stores full forecast clone (`Snapshot` + `SnapshotPayload`)
- [ ] User provides name and capture date
- [ ] List snapshots with created date

---

## US-9.2 — Compare snapshot vs actuals

**Persona:** User

**Story:** As a user, I want **variance by month and category** against a snapshot so I can see where I diverged.

**Priority:** Phase 2  
**Depends on:** US-9.1, US-8.3

### Acceptance criteria

- [ ] Side-by-side month table + category breakdown per [003-screen-specs.md §10](../specs/003-screen-specs.md)
- [ ] Highlights over/under spend by category and month
- [ ] Optional integration with Categories & Budgets when snapshot selected
