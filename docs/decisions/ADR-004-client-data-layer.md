# ADR-004: Client data layer with TanStack Query and `packages/db`

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Renan  
**User story:** [US-0.1](../user-stories/00-foundation.md#us-01--evaluate-and-lock-the-phase-1-tech-stack)

---

## Context

All data lives **on the client** (local-first). Screens need:

- Loading / error / success states without manual `useEffect` sync
- Automatic refresh after mutations (add transaction → calendar updates)
- Projection derived from stored entities, not persisted separately

The projection engine is **synchronous and pure**; storage I/O is **async**.

---

## Decision

Three-layer split:

```text
packages/app     @tanstack/react-query  (hooks only)
packages/db      async repos + loadEngineInput()
packages/engine  projectCashFlow(input)  (sync)
```

### Rules

1. **`@tanstack/react-query` only in `packages/app`** — never in `db`, `engine`, or `ui`
2. **`ProjectionResult` is not stored** — computed in a query `queryFn`
3. **Mutations** write via `db` repos, then `invalidateQueries` for affected keys
4. **Empty states** are app logic (`accounts.length === 0`), not Query errors

### Query key factory

```typescript
// packages/app/src/data/keys.ts
export const queryKeys = {
  settings: ["settings"] as const,
  accounts: ["accounts"] as const,
  transactions: (filters?: TransactionFilters) =>
    ["transactions", filters ?? {}] as const,
  projection: (asOfDate: string) => ["projection", asOfDate] as const,
};
```

### Projection hook (no useEffect)

```typescript
// packages/app/src/data/queries/useProjection.ts
import { useQuery } from "@tanstack/react-query";
import { projectCashFlow } from "@cashflow/engine";
import { loadEngineInput } from "@cashflow/db";
import { queryKeys } from "../keys";

export function useProjection(asOfDate: string) {
  return useQuery({
    queryKey: queryKeys.projection(asOfDate),
    queryFn: async () => {
      const input = await loadEngineInput();
      return projectCashFlow(input, asOfDate);
    },
    // Optional: avoid refetch churn while tuning perf
    // staleTime: 30_000,
  });
}
```

### Page usage (loading / data / empty)

```tsx
// packages/app/src/pages/YearCalendarPage/YearCalendarPage.tsx
import { useProjection } from "../../data/queries/useProjection";
import { YearCalendar } from "@cashflow/ui";
import { todayIso } from "@cashflow/core";

export function YearCalendarPage() {
  const { data, isPending, isError, error, isFetching } = useProjection(todayIso());

  if (isPending) return <CalendarSkeleton />;
  if (isError) return <ErrorPanel error={error} />;

  return (
    <>
      <CalendarHeader
        workingBalanceCents={data.workingBalanceTodayCents}
        nextNegativeDate={data.nextNegativeDate}
        refreshing={isFetching}
      />
      <YearCalendar days={data.days} />
    </>
  );
}
```

### Mutation + invalidation

```typescript
// packages/app/src/data/mutations/useCreateTransaction.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsRepo } from "@cashflow/db";
import { queryKeys } from "../keys";
import type { Transaction } from "@cashflow/core";

export function useCreateTransaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (tx: Omit<Transaction, "id">) => transactionsRepo.create(tx),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["projection"] });
      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}
```

### `loadEngineInput` bridge (db package)

```typescript
// packages/db/src/loadEngineInput.ts
import type { EngineInput } from "@cashflow/core";
import { accountsRepo, transactionsRepo, plannedItemsRepo, settingsRepo } from "./repos";

export async function loadEngineInput(): Promise<EngineInput> {
  const [
    accounts,
    transactions,
    plannedItems,
    plannedItemOverrides,
    creditCardStatements,
    installments,
    installmentPlans,
    settings,
  ] = await Promise.all([
    accountsRepo.getAll(),
    transactionsRepo.getAll(),
    plannedItemsRepo.getAll(),
    plannedItemsRepo.getAllOverrides(),
    /* ... */
    settingsRepo.get(),
  ]);

  return {
    accounts,
    transactions,
    plannedItems,
    plannedItemOverrides,
    creditCardStatements,
    installments,
    installmentPlans,
    settings,
  };
}
```

---

## Alternatives considered

### TanStack Query vs raw useEffect + useState

```tsx
// Rejected pattern
useEffect(() => {
  let cancelled = false;
  setLoading(true);
  loadEngineInput()
    .then((input) => projectCashFlow(input))
    .then((result) => { if (!cancelled) setData(result); })
    .finally(() => setLoading(false));
  return () => { cancelled = true; };
}, [deps]);
```

Manual caching, deduplication, refetch-on-focus, and mutation invalidation must be reinvented.

### TanStack DB vs TanStack Query

| | Query | TanStack DB |
|---|---|---|
| Phase 1 complexity | Low — wrap repos | Higher — collection model |
| Works with Dexie/SQLite | Yes | Yes, with integration |
| Fit | **Read repo → run engine** | Better for live collaborative sync |

**Deferred:** TanStack DB unless Query + repos become painful.

### Persist ProjectionResult in storage

**Rejected** — dual source of truth; settlement and re-anchor would require sync jobs.

---

## Consequences

**Positive**

- Calendar always reflects latest entities after any mutation
- `packages/ui` stays dumb (props in) — Storybook uses fixtures + engine directly
- Engine tests unchanged (no Query in tests)

**Negative**

- Full projection recompute on each invalidation (mitigate with perf tests; target &lt; 500 ms)
- Must maintain query key discipline

**Follow-ups**

- [ADR-006](./ADR-006-client-storage.md) — pick Dexie vs SQLite
- Add `QueryClientProvider` in app root with sensible defaults (`retry: 1` for local DB)
