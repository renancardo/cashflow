# ADR-005: TanStack Router for client-side routing

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Renan  
**User story:** [US-0.1](../user-stories/00-foundation.md#us-01--evaluate-and-lock-the-phase-1-tech-stack)

---

## Context

Phase 1 has **8 screens** plus a day-detail overlay ([003-screen-specs.md](../specs/003-screen-specs.md)):

`/`, `/month/:yyyy-mm`, `/transactions`, `/accounts`, `/forecast`, `/categories`, `/settings`, and `?day=YYYY-MM-DD` overlay. (`/snapshots` deferred to Phase 2.)

We already adopt **TanStack Query** for async client data. Routing should support typed params, search params (day panel), and loader patterns that pair with Query.

---

## Decision

Use **@tanstack/react-router** in `packages/app` only.

### Route map (target)

```typescript
// packages/app/src/routes/routeTree.gen.ts (file-based or code-based)
const rootRoute = createRootRoute({
  component: AppShell,
});

const yearRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: YearCalendarPage,
});

const monthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/month/$yearMonth",
  component: MonthCalendarPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: TransactionsPage,
});

// … accounts, forecast, categories, settings
// snapshots route deferred to Phase 2
```

### Day panel via search param

```tsx
// Open day detail: /?day=2026-07-15 or /month/2026-07?day=2026-07-15
import { useSearch } from "@tanstack/react-router";

function YearCalendarPage() {
  const { day } = useSearch({ from: yearRoute.id });
  const projection = useProjection(todayIso());

  return (
    <>
      <YearCalendar days={projection.data?.days ?? []} onSelectDay={openDay} />
      {day && (
        <DayDetailPanel
          date={day}
          onClose={() => navigate({ search: { day: undefined } })}
        />
      )}
    </>
  );
}
```

### With Query (no duplicate fetching in loaders initially)

**Phase 1 approach:** routes render pages; pages call `useProjection()` etc. Loaders can be added later for prefetch:

```typescript
// Optional later optimization
export const yearRoute = createRoute({
  // ...
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: queryKeys.projection(todayIso()),
      queryFn: async () => projectCashFlow(await loadEngineInput()),
    }),
});
```

Start simple (hooks in pages); add loaders when navigation perf matters.

---

## Alternatives considered

| Option | Verdict |
|---|---|
| **TanStack Router** | **Accepted** — pairs with Query; typed `$yearMonth` params |
| React Router v7 | Viable; less unified TanStack story |
| Defer routing | Rejected — 8 screens need nav from day one |

---

## Consequences

**Positive**

- Type-safe route and search params
- Same vendor family as Query (shared patterns, docs)
- `/installments` → `/forecast` redirect easy to declare

**Negative**

- Smaller community than React Router (acceptable for solo project)
- File-based route codegen adds build step (optional)

**Follow-ups**

- `AppShell` with nav from [003-screen-specs.md §1](../specs/003-screen-specs.md)
- Redirect `/installments` → `/forecast`
