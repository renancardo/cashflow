# Cashflow

Personal cash flow forecasting app — local-first, calendar-centric.

**Docs:** [`docs/`](docs/) · **Specs:** [`docs/specs/`](docs/specs/) · **ADRs:** [`docs/decisions/`](docs/decisions/)

---

## Prerequisites

- Node.js **20+**
- [pnpm](https://pnpm.io/) **10+** (`corepack enable` if needed)

> **pnpm 10:** `esbuild` postinstall is pre-approved in `pnpm-workspace.yaml` and `.npmrc`.
> Do **not** run interactive `pnpm approve-builds` — it blocks non-interactive terminals (including Cursor agents).
> If you see the warning again after `pnpm install`, run a clean install: `rm -rf node_modules packages/*/node_modules && pnpm install`

---

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:5173 — React app
pnpm storybook    # http://localhost:6006 — component library
pnpm test         # all packages
pnpm test:engine  # projection engine only
```

---

## Monorepo layout

```text
packages/
  core/     Shared TypeScript types + formatters
  engine/   Pure projection — projectCashFlow()
  db/       Client persistence (InMemoryDb for now; Dexie/SQLite TBD)
  ui/       React components + Storybook (Paper theme)
  app/      Vite SPA — TanStack Query + Router
```

See [`docs/specs/006-project-structure.md`](docs/specs/006-project-structure.md) for dependency rules and runtime flows.

---

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Start `@cashflow/app` dev server |
| `pnpm build`        | Typecheck/build all packages     |
| `pnpm test`         | Run Vitest in all packages       |
| `pnpm test:engine`  | Engine tests + fixtures          |
| `pnpm storybook`    | Storybook for `@cashflow/ui`     |
| `pnpm lint`         | ESLint across packages           |
| `pnpm format`       | Prettier write                   |
| `pnpm format:check` | Prettier check                   |

---

## Package dependency direction

```text
app → ui, db, engine, core
ui  → core
db  → core
engine → core
```

`@tanstack/react-query` and `@tanstack/react-router` are used **only** in `packages/app`.

---

## Current status

- **US-0.2** — monorepo scaffold ✅
- **US-1.x** — engine stub (anchors only); full projection pending
- **ADR-006** — client storage spike (Dexie vs SQLite) pending

---

## Prototypes

Static UI reference: [`docs/prototype/004/`](docs/prototype/004/) (Paper theme). Do not import prototype files from app code — port patterns into `packages/ui`.
