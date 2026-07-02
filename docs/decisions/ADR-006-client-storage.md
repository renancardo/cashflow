# ADR-006: Client persistence — Dexie vs SQLite WASM

**Status:** Proposed (decision deferred to US-0.2 scaffold)  
**Date:** 2026-07-01  
**Deciders:** Renan  
**User story:** [US-0.1](../user-stories/00-foundation.md#us-01--evaluate-and-lock-the-phase-1-tech-stack)

---

## Context

Phase 1 requires **local-first** storage ([002-phase-1-scope.md](../specs/002-phase-1-scope.md)):

- All entities from [001-data-model.md](../specs/001-data-model.md)
- JSON export/backup
- Async access from TanStack Query ([ADR-004](./ADR-004-client-data-layer.md))
- Projection recompute &lt; 500 ms (storage read path must be fast)

Both options keep data **in the browser** — no server.

---

## Decision (pending)

**Not locked yet.** Implement `packages/db` behind a **repository interface** so the storage backend can be swapped with minimal app changes.

```typescript
// packages/db/src/repos/accountsRepo.ts — interface-first
import type { Account } from "@cashflow/core";

export interface AccountsRepo {
  getAll(): Promise<Account[]>;
  getById(id: string): Promise<Account | null>;
  create(account: Omit<Account, "id">): Promise<Account>;
  update(id: string, patch: Partial<Account>): Promise<Account>;
}

// Implementation A: dexieAccountsRepo
// Implementation B: sqliteAccountsRepo
```

**Target:** choose backend during [US-0.2](../user-stories/00-foundation.md#us-02--initialize-the-application-monorepo) spike (1–2 days max).

---

## Options

### Option A: Dexie (IndexedDB)

```typescript
// packages/db/src/dexie/schema.ts
import Dexie, { type Table } from "dexie";
import type { Account, Transaction } from "@cashflow/core";

export class CashflowDb extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;

  constructor() {
    super("cashflow");
    this.version(1).stores({
      accounts: "id, type, isWorking",
      transactions: "id, accountId, effectiveDate, type",
      // …
    });
  }
}

export const db = new CashflowDb();

export const dexieAccountsRepo: AccountsRepo = {
  getAll: () => db.accounts.toArray(),
  getById: (id) => db.accounts.get(id),
  create: async (account) => {
    const row = { ...account, id: crypto.randomUUID() };
    await db.accounts.add(row);
    return row;
  },
  update: async (id, patch) => {
    await db.accounts.update(id, patch);
    return (await db.accounts.get(id))!;
  },
};
```

| Pros | Cons |
|---|---|
| Simple mental model (document tables) | No SQL for complex ad-hoc reports |
| Fast to scaffold | Export = assemble JSON from tables |
| Works offline in all modern browsers | Large fixture import untested at scale |
| Natural fit for `loadEngineInput()` parallel reads | Relational invariants enforced in app code |

### Option B: SQLite WASM (e.g. `wa-sqlite` + OPFS)

```typescript
// packages/db/src/sqlite/client.ts — illustrative
import { sqlite3Worker1Promiser } from "@sqlite.org/sqlite-wasm";

export async function openDb() {
  const promiser = await new Promise(/* init worker */);
  await promiser("open", { filename: "file:cashflow.sqlite3" });
  return promiser;
}

// packages/db/src/sqlite/accountsRepo.ts
export function createSqliteAccountsRepo(sqlite: SqlitePromiser): AccountsRepo {
  return {
    getAll: async () => {
      const rows = await sqlite("select", {
        sql: "SELECT * FROM accounts WHERE archived_at IS NULL",
      });
      return rows.map(mapAccount);
    },
    // ...
  };
}
```

| Pros | Cons |
|---|---|
| SQL migrations, FK constraints | Heavier setup (worker, OPFS quirks) |
| Familiar for relational entity graph | WASM bundle size |
| Export can be literal `.sqlite` file | Safari/OPFS edge cases to test |
| Matches “real DB” mental model | Slower to first working CRUD |

---

## Decision criteria (use during US-0.2 spike)

Score each 1–5 after a **half-day spike** per option:

| Criterion | Weight | Dexie | SQLite |
|---|---|---|---|
| Time to first `loadEngineInput()` working | High | | |
| JSON export fidelity (all entities) | High | | |
| Developer ergonomics (solo maintainer) | High | | |
| Enforcing entity relationships | Medium | | |
| Import CSV bulk load perf | Medium | | |
| Long-term schema migration story | Medium | | |

**Lean Dexie if:** priority is engine + calendar on real persisted data within days.  
**Lean SQLite if:** you value SQL migrations and constraints from day one and accept setup cost.

---

## Interim approach (recommended)

Until decided:

1. Implement **`InMemoryDb`** repos for dev/tests (used by engine fixtures integration)
2. TanStack Query hooks unchanged — they call repos, not Dexie/SQLite directly
3. Spike both backends behind `AccountsRepo` + `transactionsRepo` only
4. Lock ADR-006 status to **Accepted** with winner noted

---

## Consequences

Whichever wins:

- `packages/app` **never** imports Dexie/SQLite — only `@cashflow/db` public API
- `loadEngineInput()` remains the single read path for projection
- Export lives in `packages/db/src/export-import.ts`

**Follow-up:** Update this ADR status to **Accepted** with chosen option when spike completes.
