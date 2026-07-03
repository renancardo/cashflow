import { describe, it, expect } from "vitest";
import type { Account, Transaction } from "@cashflow/core";
import {
  aggregateWorkingBalanceAt,
  aggregateWorkingBalanceThrough,
} from "./accounts.js";

const checking: Account = {
  id: "acct-checking",
  name: "Checking",
  type: "checking",
  currency: "BRL",
  isWorking: true,
  anchorBalanceCents: 100_000,
  anchorDate: "2026-06-01",
};

describe("aggregateWorkingBalanceThrough", () => {
  it("includes transactions on throughDate (exclusive beforeDate is start-of-day)", () => {
    const todayExpense: Transaction = {
      id: "tx-today",
      type: "expense",
      amountCents: 25_000,
      accountId: checking.id,
      categoryId: "cat-food",
      description: "Today's expense",
      effectiveDate: "2026-07-02",
      sortOrder: 0,
    };

    const accounts = [checking];
    const transactions = [todayExpense];

    expect(aggregateWorkingBalanceAt(accounts, transactions, "2026-07-02")).toBe(100_000);
    expect(aggregateWorkingBalanceThrough(accounts, transactions, "2026-07-02")).toBe(75_000);
  });
});
