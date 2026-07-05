# Epic 11 — Design system & mobile patterns

Cross-cutting UI consistency: shared **Card** primitives, mobile list patterns, Storybook coverage, and alignment with the Paper prototype.

**Status (2026-07-03):** Paper tokens and atomic taxonomy exist (ADR-007). Individual screens implement ad hoc “card” styling in CSS modules (`filtersCard`, `controlsCard`, mobile row borders). **Accounts** mobile rows use bordered rounded cards; **Forecast** and **Installment** mobile rows use a flatter stacked list inside a single table container; **Transactions** mobile rows use bordered cards with absolute-positioned handles. No shared `Card` or `ListItemCard` component yet. Storybook has ~27 stories but no card primitives or mobile layout gallery.

---

## US-11.1 — App design audit and pattern inventory

**Persona:** Developer / designer

**Story:** As a team member, I want a **written inventory of UI patterns and inconsistencies** so we can standardize components deliberately rather than per-screen CSS duplication.

**Priority:** P1  
**Depends on:** US-0.3

### Acceptance criteria

- [ ] Document compares live app + Storybook against `docs/prototype/004/` and [004-style-guide.md](../specs/004-style-guide.md) for each Phase 1 screen
- [ ] Lists repeated layout patterns with file references (see inventory below)
- [ ] Calls out spacing, border-radius, and mobile breakpoint inconsistencies (768px vs 640px vs 960px)
- [ ] Produces a short **decision log**: which patterns become shared components vs stay screen-local
- [ ] Linked from [README](./README.md) and optionally from ADR-007 appendix

### Pattern inventory (starting point)

| Pattern | Current locations | Mobile behavior | Standardize? |
|---|---|---|---|
| **Filter / toolbar card** | `TransactionsScreen.filtersCard`, `ForecastScreen.filtersCard`, `CategoriesScreen.controlsCard` | Full-width bordered surface | Yes → `SurfaceCard` |
| **Summary strip** | `SummaryStrip` molecule | Wraps on narrow viewports | Optional `SurfaceCard` wrapper |
| **Entity list container** | `AccountList.list`, `ForecastScreen` table wrapper, `TransactionsScreen.list` | Table → card stack | Yes → `EntityList` + `ListItemCard` |
| **Mobile entity row** | `AccountRow` (bordered card), `ForecastItemRow` (flat row + dashed footer), `InstallmentPlanRow` (flat row), `TransactionsScreen.row` (bordered card) | Similar grid areas, different borders/padding | Yes → `ListItemCard` |
| **Calendar surfaces** | `MonthCalendarScreen.calendar`, year scroll grid | Unique — keep screen-local | No (use tokens only) |
| **Editor slide-over** | `EditorPanel`, `DayDetailPanel`, `TransactionEditorPanel` | Full-screen on mobile | Review shared shell (P2) |
| **Quick-add card** | `QuickAddCard` | Already a named card | Rename or wrap with `SurfaceCard` |
| **Day panel item row** | `DayDetailPanel.item` | Desktop grid; mobile stacks | Consider `ListItemCard` variant or `DayItemRow` molecule |
| **Chip + meta row** | Account, forecast, transaction, category rows | Repeated flex wrap | Keep `Chip`; document meta line pattern |
| **Empty / loading states** | Per-screen copy | Inconsistent | P2 — `AppStatus` already exists |

**Screens without mobile card treatment yet (candidates for follow-up):**

- **Categories** — horizontal scroll table at narrow widths (`CategoriesScreen`); may need card rows or simplified tree
- **Snapshots** — Phase 2 (deferred from v1)
- **Settings** — form sections could use `SurfaceCard`
- **Accounts** desktop table header — already card-like on mobile only

---

## US-11.2 — SurfaceCard and ListItemCard components

**Persona:** Developer

**Story:** As a developer, I want **reusable Card components in `@cashflow/ui`** so filters, lists, and mobile rows share one visual language.

**Priority:** P1  
**Depends on:** US-11.1

### Acceptance criteria

- [ ] **`SurfaceCard`** atom/molecule: white surface, 1px border, `radius-md`, optional padding variants (`sm` / `md` / `none`), optional `as` prop for semantic element
- [ ] **`ListItemCard`** molecule: mobile-first entity row built on `SurfaceCard` or shared tokens — slots for **title**, **meta** (chips + muted text), **trailing** (amount / actions), **footer** (optional dashed divider + controls), **leading** (optional icon/handle)
- [ ] Props cover common cases: `selected`, `dormant`/`muted`, `interactive` (button/link wrapper)
- [ ] CSS uses Paper tokens only; no screen-specific grid column counts inside the card (consumers supply grid areas via children or sub-slots)
- [ ] Exported from `packages/ui/src/index.ts`
- [ ] Does not break desktop table layouts — cards activate at `@media (max-width: 768px)` via modifier or companion `ListItemTableRow` wrapper

**Reference implementations to converge:**

- Accounts mobile — `AccountRow.module.css` `@media (max-width: 768px)` (bordered card, grid areas)
- Forecast mobile — `ForecastItemRow.module.css` (info / amount / details / controls)
- Transactions mobile — `TransactionsScreen.module.css` (card + absolute handle)

---

## US-11.3 — Storybook card gallery

**Persona:** Developer / designer

**Story:** As a reviewer, I want **Storybook stories for Card components and mobile list variants** so we can approve layouts before migrating production screens.

**Priority:** P1  
**Depends on:** US-11.2

### Acceptance criteria

- [ ] `SurfaceCard.stories.tsx` — default, compact padding, no padding (calendar-style chrome), on paper background decorator
- [ ] `ListItemCard.stories.tsx` — variants:
  - Account (name, type chip, working toggle, balance)
  - Forecast planned item (name, amount, account · recurrence, active toggle + actions)
  - Installment plan (name, progress, next due)
  - Transaction (date, description, amount, category · account, drag handle)
  - Day panel projected item (description, chips, editable amount slot, confirm button slot)
- [ ] Mobile viewport default (`mobile1`) on list item stories; desktop breakpoint story shows table composition note
- [ ] Side-by-side story or docs page comparing **before** (screenshot from `e2e/tmp/screenshots/`) vs **after** standardized card
- [ ] Stories listed under Atoms/Molecules per ADR-007 sidebar order

---

## US-11.4 — Migrate screens to shared cards

**Persona:** Developer

**Story:** As a developer, I want **Accounts, Forecast, Transactions, and related lists refactored to shared cards** so mobile UI stays consistent and CSS duplication shrinks.

**Priority:** P2  
**Depends on:** US-11.2, US-11.3

### Acceptance criteria

- [ ] **Accounts** — `AccountRow` mobile layout uses `ListItemCard`; desktop table unchanged
- [ ] **Forecast** — `ForecastItemRow` and `InstallmentPlanRow` mobile layouts use `ListItemCard`; filter toolbar uses `SurfaceCard`
- [ ] **Transactions** — mobile row uses `ListItemCard` with leading handle slot; filter card uses `SurfaceCard`
- [ ] **Categories** — filter/control section uses `SurfaceCard`; evaluate category row cards (P2 if table retained)
- [ ] **Day panel** — projected item rows align visually with `ListItemCard` footer pattern (confirm button row)
- [ ] No visual regression on desktop (Playwright or manual checklist)
- [ ] Remove duplicated border/radius/padding rules from screen modules where replaced
- [ ] Per-screen mobile screenshots updated in `e2e/tmp/screenshots/` or Storybook references

---

## US-11.5 — Design review checkpoint (app-wide)

**Persona:** Product owner / designer

**Story:** As a stakeholder, I want a **single design review pass across Phase 1 screens** so typography, density, and mobile flows feel like one product.

**Priority:** P2  
**Depends on:** US-11.1, US-3.10

### Acceptance criteria

- [ ] Walkthrough checklist covers: Year, Month, Day panel, Transactions, Accounts, Forecast, Categories, Settings
- [ ] Each screen compared to matching `docs/prototype/004/*.html` page; gaps logged as new stories or marked won’t-fix
- [ ] Decisions recorded for: default mobile landing (year vs month), bottom nav vs side nav emphasis, header metric truncation
- [ ] Open issues triaged into Epic 3, 11, or screen-specific epics
- [ ] Sign-off criteria for Phase 1 “UI complete” updated in [005-prd.md](../specs/005-prd.md) if needed

---
