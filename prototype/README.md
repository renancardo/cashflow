# UI Prototypes

Static HTML/CSS/JS prototypes for Phase 1 screens. No build step, no backend — open any `.html` file in a browser.

These prototypes show **how the UI looks and behaves** with mock data. Written specs in [`../docs/specs/`](../docs/specs/) define what to build.

---

## Themes

| Folder | Theme | Status | Start here |
|---|---|---|---|
| [`004/`](004/) | **Paper** | **Canonical** — locked in [004-style-guide](../docs/specs/004-style-guide.md) | [`004/index.html`](004/index.html) |
| [`005/`](005/) | Ink | Exploratory alternate (teal/dark nav) | [`005/index.html`](005/index.html) |
| [`006/`](006/) | Analytical | Exploratory alternate (dashboard-style) | [`006/index.html`](006/index.html) |

**Phase 1 implementation must follow `004/` (Paper).** Folders `005` and `006` are kept for reference only.

Each theme folder is self-contained: its own `css/`, `js/`, and `DESIGN.md` with theme-specific tokens.

---

## Screens (all themes)

Every theme implements the same nine Phase 1 screens:

| Screen | File | Spec ref |
|---|---|---|
| Hub / index | `index.html` | — |
| Year Calendar | `year.html` | Screen 1 |
| Month Calendar | `month.html` | Screen 2 |
| Day Detail Panel | overlay on calendar pages + `day-panel.html` | Screen 3 |
| Transactions | `transactions.html` | Screen 4 |
| Accounts | `accounts.html` | Screen 5 |
| Forecast Items | `forecast.html` | Screen 6 |
| Categories & Budgets | `categories.html` | Screen 7 |
| Snapshots | `snapshots.html` | Screen 8 |
| Settings | `settings.html` | Screen 9 |

See [`../docs/specs/003-screen-specs.md`](../docs/specs/003-screen-specs.md) for per-screen behavior.

---

## Preview locally

From the repo root:

```bash
# Paper (canonical)
open prototype/004/index.html

# Or any screen directly
open prototype/004/year.html
```

On Linux, replace `open` with `xdg-open`. A local static server also works if you prefer:

```bash
cd prototype/004 && python3 -m http.server 8080
# then visit http://localhost:8080
```

---

## Structure (per theme folder)

```
004/
├── index.html          # hub linking all screens
├── year.html           # screen HTML
├── css/
│   ├── paper.css       # global tokens + app shell (004 only)
│   ├── year.css        # screen-specific styles
│   └── …
├── js/
│   ├── nav.js          # mobile drawer + bottom nav
│   ├── year.js         # calendar interactions
│   └── …
└── DESIGN.md           # theme notes (tokens summary)
```

Shared CSS naming: each screen links the global theme file (`paper.css`, `ink.css`, or `analytical.css`) plus its own screen CSS.

---

## What prototypes do / don't do

| ✅ Included | ❌ Not included |
|---|---|
| Layout, typography, colors | SQLite / persistence |
| Navigation between screens | Projection engine |
| Modals, editors, empty states (mock) | Real data CRUD |
| Mobile + desktop responsive shell | i18n wiring |
| Calendar interactions (scroll, day select) | CSV import / export |

The real app will live outside this folder (future `apps/web/` or similar).
