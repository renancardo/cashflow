# Engine fixtures

Named `EngineInput` datasets for projection engine tests, Storybook demos, and QA. All money values are **integer cents** (BRL). Dates are ISO `YYYY-MM-DD`. All data is **fictional** — no real account names or personal ledger entries.

Import:

```ts
import { fixtures, getFixture, FIXTURE_CATALOG } from "@cashflow/engine/fixtures";
```

## Catalog

| ID                                                    | Purpose                                                           | `asOfDate`   | Key expectations (full engine)                             |
| ----------------------------------------------------- | ----------------------------------------------------------------- | ------------ | ---------------------------------------------------------- |
| [`basic-salary-rent`](./basic-salary-rent.json)       | Minimal income + expense on one account                           | `2026-06-01` | Balance R$ 5.000; salary day 5, rent day 10                |
| [`credit-card-cycle`](./credit-card-cycle.json)       | Brazilian card cycle (fechamento 26 / vencimento 1)               | `2026-06-27` | Purchase Jun 27 → working hit **Aug 1**, not purchase date |
| [`installment-plan`](./installment-plan.json)         | Multi-plan loans; mix of paid + scheduled                         | `2026-06-03` | Paid Jun installments suppressed; Jul still projects       |
| [`recurrence-overrides`](./recurrence-overrides.json) | Skip / modify / move occurrences                                  | `2026-06-01` | July salary skipped; August HOA bumped                     |
| [`settlement-links`](./settlement-links.json)         | `settlesPlannedItemId`, `settlesInstallmentId`, `paysStatementId` | `2026-06-25` | Settled items suppress duplicate projection                |
| [`household-june-2026`](./household-june-2026.json)   | Rich multi-account household scenario                             | `2026-07-01` | See below                                                  |

## `household-june-2026` — comprehensive dummy fixture

A realistic but entirely fictional household budget for June–July 2026.

### Accounts (7)

| Account            | Type        | Working | Anchor (2026-06-01)                  |
| ------------------ | ----------- | ------- | ------------------------------------ |
| Primary Checking   | checking    | yes     | R$ 3.500,00                          |
| Secondary Checking | checking    | yes     | R$ 800,00                            |
| Digital Wallet     | wallet      | yes     | R$ 150,00                            |
| Emergency Savings  | savings     | yes     | R$ 5.000,00                          |
| Main Credit Card   | credit_card | no      | R$ 1.200,00 owed (closing 26, due 1) |
| Store Card         | credit_card | no      | R$ 450,00 owed                       |
| Brokerage          | investment  | no      | R$ 2.500,00                          |

### Ledger (33 transactions)

Jun 1 – Jul 1 activity: groceries, payroll advances, salaries from two employers, mortgage, HOA, family support, income tax, loan installments, card charges, wallet transfers, severance fund bonus, school tuition.

### Planned items (13)

Recurring: two salaries, payroll advance, mortgage, HOA, rental property, family support (×2), school tuition, advisory fee, streaming, gym, monthly investment transfer.

### Installments & statements

- **Loan Alpha** 36× R$ 180,47 — Jun paid, Jul scheduled
- **Loan Beta** 24× R$ 224,33 — Jun paid, Jul scheduled
- **Loan Gamma** 12× R$ 1.990,98 — Jun paid, Jul scheduled
- **Main Credit Card** statements: May–Jun cycle (paid Jun 25), Jun–Jul cycle open

### Expected behavior (once engine US-1.2–1.6 land)

| Check                                | Notes                                            |
| ------------------------------------ | ------------------------------------------------ |
| `asOfDate`                           | `2026-07-01`                                     |
| Card purchase on Main Credit Card    | No working impact until statement due date       |
| Transfers between working accounts   | Net zero on aggregate                            |
| Settled installments / planned items | Suppressed from projection                       |
| Large outflows mid-month             | Tax, mortgage, loan gamma trigger `largeOutflow` |

## Adding a fixture

1. Add JSON under `fixtures/`.
2. Register in `fixtures/index.ts` + `FIXTURE_CATALOG`.
3. Add a test in `src/fixtures.test.ts`.
4. Document expected `nextNegativeDate` / balances here.
