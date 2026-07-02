# Epic 0 — Foundation & tech stack

Project setup, stack evaluation, and development tooling. **Ship before or in parallel with the projection engine.**

---

## US-0.1 — Evaluate and lock the Phase 1 tech stack

**Persona:** Developer

**Story:** As a developer, I want to **evaluate and document the Phase 1 tech stack** so that implementation choices are deliberate and aligned with local-first, calendar-heavy UI needs.

**Priority:** P0  
**Depends on:** —

### Acceptance criteria

- [ ] A short **ADR or stack doc** (in repo or PRD appendix) compares at least:
  - **UI:** React (leading candidate) vs alternatives considered
  - **Build:** Vite (or equivalent)
  - **Component dev:** Storybook
  - **Styling:** CSS modules / tokens from [004-style-guide.md](../specs/004-style-guide.md)
  - **Storage:** local-first (e.g. SQLite via WASM, IndexedDB, or similar)
  - **Testing:** Vitest (or Jest) for engine + unit; Playwright optional for E2E later
- [x] Documented in [`docs/decisions/`](../decisions/) — ADR-001 through ADR-007
- [x] Decision records **why React + Storybook** fit Phase 1 — [ADR-001](../decisions/ADR-001-monorepo-react-vite.md), [ADR-007](../decisions/ADR-007-storybook-vitest.md)
- [x] Decision records **non-goals for Phase 1:** [ADR-001](../decisions/ADR-001-monorepo-react-vite.md) — no cloud backend, no SSR, no multi-currency
- [x] Stack doc links to [002-phase-1-scope.md](../specs/002-phase-1-scope.md) NFRs — see [decisions/README.md](../decisions/README.md)

---

## US-0.2 — Initialize the application monorepo

**Persona:** Developer

**Story:** As a developer, I want a **initialized project structure** so that engine, UI, and shared types can evolve without prototype copy-paste.

**Priority:** P0  
**Depends on:** US-0.1

### Acceptance criteria

- [ ] Repo contains a clear layout, e.g.:
  - `packages/engine/` — pure JS projection (no React)
  - `packages/app/` — React application
  - `packages/ui/` (optional) — shared components + Storybook
- [ ] Root tooling: package manager lockfile, ESLint, Prettier (or project conventions)
- [ ] Scripts: `dev`, `test`, `build`, `storybook`
- [ ] Engine package is importable from app without circular deps
- [ ] README at app root explains how to run dev + tests

---

## US-0.3 — Storybook with Paper theme baseline

**Persona:** Developer / designer

**Story:** As a developer, I want **Storybook running with Paper theme tokens** so that calendar and money components can be built and reviewed in isolation before full app wiring.

**Priority:** P0  
**Depends on:** US-0.2

### Acceptance criteria

- [ ] Storybook starts locally and builds statically
- [ ] Global decorators apply Paper tokens from [004-style-guide.md](../specs/004-style-guide.md) (background, typography, semantic colors)
- [ ] At least **3 starter stories** exist:
  - Money formatter (BRL cents → display)
  - Date formatter (pt-BR / en)
  - Calendar day cell (empty, red dot, income indicator)
- [ ] Stories document prop tables for key components
- [ ] Storybook is the canonical place to preview engine-driven calendar states once [US-1.9](./01-projection-engine.md#us-19--storybook-visualization-of-fixture-projections) lands

---

## US-0.4 — Test and CI baseline

**Persona:** Developer

**Story:** As a developer, I want a **minimal test runner and CI hook** so that engine and UI regressions are caught early.

**Priority:** P1  
**Depends on:** US-0.2

### Acceptance criteria

- [ ] `npm test` (or equivalent) runs unit tests in `packages/engine`
- [ ] CI workflow (GitHub Actions or similar) runs lint + test on push/PR
- [ ] Engine tests run without browser/DOM when possible
- [ ] Documented target: projection recompute &lt; 500 ms (perf test added when engine has realistic fixtures)
