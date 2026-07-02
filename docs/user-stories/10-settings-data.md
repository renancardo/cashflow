# Epic 10 — Settings, i18n & data ownership

App configuration, localization, export, and backup.

---

## US-10.1 — Configure projection and alert settings

**Persona:** User

**Story:** As a user, I want to **configure buffer, thresholds, and alert lead time** so warnings match my comfort level.

**Priority:** P0  
**Depends on:** US-1.6

### Acceptance criteria

- [ ] Settings: `negativeBufferCents`, `largeOutflowThresholdCents`, `alertLeadTimeDays`, `horizonMonths`
- [ ] Changes trigger projection recompute
- [ ] Defaults: buffer R$ 0, large outflow R$ 500, lead time documented in screen spec

---

## US-10.2 — Full export and backup

**Persona:** User

**Story:** As a user, I want **full JSON export** of all data so I own my finances locally with no cloud lock-in.

**Priority:** P0  
**Depends on:** US-0.2

### Acceptance criteria

- [ ] Export includes all Phase 1 entities
- [ ] Download to file; optional import/restore deferred or minimal if in scope
- [ ] No telemetry; no external calls

---

## US-10.3 — Portuguese and English UI

**Persona:** User

**Story:** As a user, I want the app in **pt-BR or English** with correct date and currency formatting.

**Priority:** P0  
**Depends on:** US-0.3

### Acceptance criteria

- [ ] Language switch in Settings; applies immediately app-wide
- [ ] Dates and BRL formatted per locale
- [ ] Domain glossary terms consistent (see [000-initial-ideas.md §5](../ideas/000-initial-ideas.md))
- [ ] Storybook stories verify formatters for both locales
