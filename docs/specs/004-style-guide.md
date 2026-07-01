---
name: Style Guide (Phase 1)
overview: Locked visual system for Phase 1 — Paper theme tokens, layout, components, and semantic colors. Canonical reference implementation is prototype/004.
status: locked
isProject: false
---

# Style Guide — Phase 1 (Paper)

> **Purpose:** Single source of truth for visual design during Phase 1 implementation. All screens, components, and semantic colors must conform to this guide.
>
> **Sources:** [002-phase-1-scope.md](./002-phase-1-scope.md), [003-screen-specs.md](./003-screen-specs.md).
>
> **Canonical reference:** [`prototype/004/`](../../prototype/004/) — static HTML/CSS prototypes implementing this guide. Prototypes `005` (Ink) and `006` (Analytical) are exploratory alternates; **do not use them for Phase 1 implementation**.

---

## 1. Design direction (locked)

| Decision | Choice |
|---|---|
| Theme name | **Paper** |
| Aesthetic | Print-inspired, minimal, tactile — paper texture background, restrained palette, monospace labels |
| Primary accent | Near-black (`#111111`) for text, headings, and primary actions |
| Secondary accent | Violet (`#8B5CF6`) for focus rings, active mobile tabs, card/statement semantics, and selection highlights |
| Data density | Data-forward calendar grids; generous touch targets on mobile |
| Reference CSS | `prototype/004/css/paper.css` (global tokens + shell) + per-screen CSS files |

**Design principles:**
- Money and dates are always formatted via locale (`Settings`); never hardcode `R$` or `DD/MM` in components.
- Semantic color communicates *meaning* (below buffer, income, outflow), not decoration.
- Surfaces are white cards on a warm paper canvas; borders are light gray, not heavy shadows.
- Labels and metadata use **PT Mono** uppercase caps; body copy uses **Roboto**; headings use **Montserrat**.

---

## 2. Design tokens

All tokens live in `:root` inside [`prototype/004/css/paper.css`](../../prototype/004/css/paper.css). Screen CSS may define local overrides scoped to a component (e.g. calendar day-cell sizes).

### 2.1 Color palette

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#111111` | Headings, primary buttons, today ring, nav brand |
| `--color-secondary` | `#8B5CF6` | Focus rings, card indicators, planned-item chips, mobile active tab |
| `--color-success` | `#16A34A` | Income, positive flows, toggle-on |
| `--color-warning` | `#D97706` | Large outflow indicator, installment chips |
| `--color-danger` | `#DC2626` | Below-buffer, alert badge, negative balance, past-due |
| `--color-surface` | `#FFFFFF` | Cards, panels, nav, inputs |
| `--color-text` | `#111827` | Body text, future day numbers |
| `--color-text-muted` | `#6B7280` | Labels, metadata, past day numbers |
| `--color-border` | `#E5E7EB` | Dividers, input borders, grid lines |
| `--color-weekend` | `#F3F4F6` | Weekend column band (Sat/Sun) |
| `--color-paper` | `#FAF8F5` | Page background, panel headers, dashed projected rows |
| `--color-paper-shadow` | `#EBE6DF` | Reserved for elevation accents |

**Derived tints (hardcoded in components — promote to tokens if reused):**

| Context | Background | Border / text |
|---|---|---|
| Alert badge | `#FEF2F2` | `#FECACA` / `--color-danger` |
| Income chip | `#ECFDF5` | `#BBF7D0` / `--color-success` |
| Planned / card chip | `#F5F3FF` | `#DDD6FE` / `--color-secondary` |
| Subscription chip | `#EFF6FF` | `#BFDBFE` / `#2563EB` |
| Installment chip | `#FFF7ED` | `#FED7AA` / `--color-warning` |

### 2.2 Typography

| Role | Font | Typical size | Weight |
|---|---|---|---|
| Display / headings | Montserrat (`--font-display`) | 1rem – 2.5rem | 600–700 |
| Body | Roboto (`--font-body`) | 0.8125rem – 1rem | 400–500 |
| Labels / caps | PT Mono (`--font-mono`) | 0.625rem – 0.875rem | 400–600 |

**Type scale (rem, base 16px):** 14 / 16 / 18 / 24 / 32 / 40 px equivalents (`0.875` / `1` / `1.125` / `1.5` / `2` / `2.5`).

**Label pattern:** uppercase, `letter-spacing: 0.06em`, `--color-text-muted`.

**Money display:** Montserrat, semibold; income uses `--color-success`; expenses use `--color-text` or `--color-danger` when flagged.

### 2.3 Spacing & radius

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |

| Token | Value |
|---|---|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-full` | 9999px |

### 2.4 Layout & elevation

| Token | Value | Usage |
|---|---|---|
| `--nav-width` | 220px | Desktop sidebar |
| `--header-height` | 56px | Mobile top bar |
| `--bottom-nav-height` | 64px | Mobile tab bar + safe area |
| `--touch-min` | 44px | Minimum interactive target |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle lift |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Tooltips, drawer |

### 2.5 Breakpoint

| Name | Width | Behavior |
|---|---|---|
| Mobile | `< 769px` | Bottom nav, hamburger drawer, bottom-sheet day panel |
| Desktop | `≥ 769px` | Persistent sidebar, right-rail day panel, larger calendar cells |

---

## 3. App shell & navigation

Implemented in `paper.css`. Every screen shares this chrome ([003-screen-specs §0](./003-screen-specs.md)).

```
┌─────────────────────────────────────────────┐
│  [Mobile header: ☰ + screen title]          │  ← mobile only
├─────────────────────────────────────────────┤
│  Working balance │ Next below buffer │ ⚠    │  ← header-strip (calendar screens)
├──────────┬──────────────────────────────────┤
│  Nav     │  Page content                    │
│  (220px) │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
│  Calendar │ Txn │ Forecast │ Categories │ More │  ← bottom-nav, mobile only
└─────────────────────────────────────────────┘
```

| Region | Classes | Notes |
|---|---|---|
| Shell | `.app`, `.main`, `.page` | Paper texture on `body`; content scrolls inside `.page` |
| Sidebar | `.nav`, `.nav__link`, `.nav__link--active` | Hidden on mobile; drawer via `.nav--open` + `.nav-overlay` |
| Mobile header | `.mobile-header`, `.mobile-header__menu` | Sticky; opens drawer |
| Bottom tabs | `.bottom-nav`, `.bottom-nav__item--active` | Five tabs: Calendar, Transactions, Forecast, Categories, More |
| Metric strip | `.header-strip`, `.metric`, `.badge--alert` | North-star metrics per [002 §1](./002-phase-1-scope.md) |
| Condensed strip | `.header-strip--condensed` | Non-calendar screens: shorter top bar |

**Active nav:** sidebar link = filled `--color-primary` pill; bottom tab = `--color-secondary` text.

---

## 4. Global components

### 4.1 Buttons

| Class | Appearance |
|---|---|
| `.btn--primary` | Black fill, white text |
| `.btn--ghost` | Transparent, border, min-height `--touch-min` |
| `.btn--icon` | Square ghost button for prev/next |
| `.btn--sm` | Compact variant (panels) |
| `.btn--success` | Green confirm actions |

Hover states darken fill or lighten background; disabled icon buttons at 35% opacity.

### 4.2 Badges & chips

**Badge** (`.badge--alert`): inline alert pill with dot — used for lead-time warning in calendar header.

**Chip** (`.chip` + modifiers): uppercase mono tag on rows and items.

| Modifier | Meaning |
|---|---|
| `.chip--income` / `.chip--expense` / `.chip--transfer` | Transaction type |
| `.chip--actual` | Settled / ledger item |
| `.chip--planned` | Recurring or one-off forecast item |
| `.chip--subscription` | `isSubscription` planned item |
| `.chip--installment` | Installment plan payment |
| `.chip--statement` / `.chip--card` | Credit card statement |
| `.chip--settle` | Settlement link indicator |

### 4.3 Forms

Shared patterns across Settings, editors, and quick-add:

- Field label: `.form-group__label` or `*__label` — mono caps
- Input / select: 1px `--color-border`, `--radius-sm`, focus → `--color-secondary` border + `rgba(139,92,246,0.15)` ring
- Hint text: smaller muted body below field
- Toggle: `.toggle`, `.toggle--on` — visual switch (green when on)

Filter bars (Transactions, Forecast) use bordered surface cards with grid-aligned controls.

### 4.4 Help tooltip

`.help-tooltip` — hover/focus panel for calendar legends. Trigger is a bordered ghost button with `?` icon. Panel lists semantic markers with colored dots matching calendar indicators.

### 4.5 Empty, loading, error states

Per [003-screen-specs §14](./003-screen-specs.md):

| State | Pattern |
|---|---|
| Empty | Centered icon + title + description + primary CTA (see `.forecast-empty`, `.txn-empty`) |
| Loading | Skeleton placeholders matching grid/list geometry — **no spinners** on calendar |
| Error | Inline, actionable message with retry — never silent failure |

---

## 5. Calendar system

The linear year calendar is the product's signature UI ([002 §2.9](./002-phase-1-scope.md)). CSS split: `year.css` (year), `month.css` (month), `day-panel.css` (overlay + shared day-cell interaction).

### 5.1 Year view — linear grid

**Layout:** months as rows; each row is a 37-column weekday grid (padding cells + up to 31 days). Sticky month labels on left/right; sticky weekday band top and bottom. Horizontal scroll on narrow viewports.

| Element | Class | Size (mobile / desktop) |
|---|---|---|
| Day cell | `.day-cell` | 28px / 35px square |
| Month label | `.month-row__label` | mono caps, sticky |
| Weekend band | `.day-cell:nth-child(7n+1)`, `7n+7` | `--color-weekend` background |

**Day number:** mono, top-left aligned, zero-padded (`01`–`31`).

### 5.2 Temporal states (year cells)

Applied via JS (`day-cell--past`, `day-cell--today`, `day-cell--future`):

| State | Visual |
|---|---|
| **Past** | Muted gray text (`#9CA3AF`), light gray fill; weekend past slightly darker; indicators at 45% opacity |
| **Today** | `--color-primary` text, bold, white surface, 2px primary ring (`::before`) |
| **Future** | `--color-text`, medium weight — active forecast range |

### 5.3 Year indicators (dot semantics)

Bottom-right `.day-cell__indicators` stack. Each indicator is 4×4px (card: 5×5px square).

| Class | Color | Meaning |
|---|---|---|
| `.indicator--danger` | `--color-danger` | Projected balance **below buffer** (red dot) |
| `.indicator--success` | `--color-success` | Net **income** day |
| `.indicator--warning` | `--color-warning` | **Large outflow** (above `Settings.largeOutflowThresholdCents`) |
| `.indicator--card` | `--color-secondary` | **Card statement due** (rounded square) |

Multiple indicators may coexist on one day.

### 5.4 Month view — dense grid

Seven-column classic month grid inside `.month-calendar`. Cells are taller (`min-height: 5.5rem`) and show:

| Element | Class |
|---|---|
| Day number | `.day-cell__num` |
| End balance | `.day-cell__balance`, `.day-cell__balance--danger` |
| Flow entries | `.day-cell__entry--*` |
| Below buffer | `.day-cell--below-buffer` — **inset left red bar** (3px), not a dot |

**Flow entry colors** (month grid only):

| Class | Color | Meaning |
|---|---|---|
| `.day-cell__entry--actual-income` | `#15803D` | Posted income |
| `.day-cell__entry--projected-income` | `#4ADE80` | Future income |
| `.day-cell__entry--actual-outflow` | `#B45309` | Posted expense |
| `.day-cell__entry--projected-outflow` | `#FBBF24` | Future expense |
| `.day-cell__entry--past-due` | `#DC2626` | Overdue obligation |

Weekend columns use the same `--color-weekend` band as the year view.

### 5.5 Day cell interaction

From `day-panel.css`:

| State | Style |
|---|---|
| Hover | `rgba(139,92,246,0.06)` wash |
| Selected | `rgba(139,92,246,0.12)` wash, semibold |
| Cursor | pointer on non-empty cells |

Clicking a day opens the **Day Detail Panel** (Screen 3).

### 5.6 Day detail panel

| Viewport | Behavior |
|---|---|
| Mobile | Bottom sheet (`.day-panel`), drag handle, `92dvh` max height |
| Desktop | Right rail (`420px`), slides from right |

**Structure:** header (date, balance breakdown, below-buffer flag) → scrollable item groups → quick-add footer on `--color-paper`.

**Item rows:** `.day-item` (solid border) vs `.day-item--projected` (dashed border, paper background). Amounts: green for income, default text for expense. Editable statement payments show pencil affordance on hover.

---

## 6. Screen-specific styles

Each Phase 1 screen adds a scoped CSS file. All link `paper.css` first.

| Screen | CSS file | Key components |
|---|---|---|
| 1 Year Calendar | `year.css` | Linear grid, indicators, toolbar |
| 2 Month Calendar | `month.css` | Summary strip, month grid, flow entries |
| 3 Day Detail Panel | `day-panel.css` | Overlay, panel, items, quick-add |
| 4 Transactions | `transactions.css` | Filter bar, ledger table, editor overlay |
| 5 Accounts | `accounts.css` | Account cards, re-anchor dialog |
| 6 Forecast Items | `forecast.css` | Filter chips, grouped lists, recurrence dialog |
| 7 Categories & Budgets | `categories.css` | Budget bars, variance table, category editor |
| 8 Snapshots | `snapshots.css` | Snapshot list, compare table |
| 9 Settings | `settings.css` | Grouped sections, export block |

Shared JS for mobile nav: `js/nav.js`.

---

## 7. Semantic color → data mapping

Quick reference for implementers wiring the projection engine:

| Data condition | Year view | Month view | Elsewhere |
|---|---|---|---|
| `ProjectionDay.belowBuffer` | Red dot | Left inset bar + danger balance | Day panel flag badge |
| Net inflow day | Green dot | Green flow entry | — |
| Outflow &gt; threshold | Amber dot | Amber flow entry | — |
| Statement due | Violet square dot | — | `.chip--statement` |
| Actual transaction | — | Solid flow color (darker) | `.chip--actual`, solid `.day-item` |
| Planned / projected | — | Lighter flow color | Dashed `.day-item--projected`, `.chip--planned` |
| Past due | — | Red flow entry | — |
| Alert within lead time | Header `.badge--alert` | Same | Same |

---

## 8. Accessibility & motion

| Concern | Rule |
|---|---|
| Touch targets | Minimum 44×44px (`--touch-min`) |
| Focus | Visible ring using secondary color — match existing `focus-visible` patterns |
| Keyboard | Calendar grid navigable (baseline NFR); all forms tabbable |
| Motion | Panel transitions ≤ 300ms; respect `prefers-reduced-motion` in implementation |
| Contrast | Primary text on surface meets WCAG AA; muted text for non-critical metadata only |

---

## 9. i18n & formatting

- All user-visible strings are translation keys (pt-BR + en).
- **Currency:** integer cents → locale currency formatter (BRL in Phase 1).
- **Dates:** ISO storage; display via `Settings.dateFormat`.
- **Number padding:** day cells use two-digit display (`01`); locale does not affect cell width.

---

## 10. Out of scope for this guide

These are explicitly **not** part of the locked Paper system:

| Item | Notes |
|---|---|
| Prototype 005 (Ink) / 006 (Analytical) themes | Exploratory; not Phase 1 |
| Dark mode | Phase 2+ |
| Style switcher / user theme picker | Prototype 006 experiment only |
| Insights screen visuals | Phase 2 stub — minimal placeholder |
| Custom illustrations or marketing assets | Not required for Phase 1 |

---

## 11. Traceability

| Style area | Scope ref | Screen spec ref |
|---|---|---|
| Calendar header metrics | [002 §1](./002-phase-1-scope.md) | [003 §3](./003-screen-specs.md) |
| Red-dot / below-buffer | [002 §2.8–2.9](./002-phase-1-scope.md) | [003 §3–4](./003-screen-specs.md) |
| Flow entry colors | [002 §2.9](./002-phase-1-scope.md) | [003 §4](./003-screen-specs.md) |
| Day panel + quick-add | [002 §2.9](./002-phase-1-scope.md) | [003 §5](./003-screen-specs.md) |
| Chips / source types | [002 §2.3–2.6](./002-phase-1-scope.md) | [003 §6–8](./003-screen-specs.md) |
| Global chrome | [003 §0](./003-screen-specs.md) | All screens |

---

## 12. Next document

| Order | Document | Uses this guide for |
|---|---|---|
| 1 | [005-prd.md](./005-prd.md) | User stories + acceptance criteria with visual references |
