import { describe, it, expect } from "vitest";
import type { Account, Transaction } from "@cashflow/core";
import {
  aggregateWorkingBalanceAt,
  aggregateWorkingBalanceThrough,
  computeHistoryStart,
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

describe("computeHistoryStart", () => {
  it("returns earliest working account anchor when before asOfDate", () => {
    expect(computeHistoryStart([checking], "2026-07-12")).toBe("2026-06-01");
  });

  it("returns asOfDate when anchor is after asOfDate", () => {
    const futureAnchor: Account = {
      ...checking,
      anchorDate: "2026-08-01",
    };

    expect(computeHistoryStart([futureAnchor], "2026-07-12")).toBe("2026-07-12");
  });

  it("returns asOfDate when there are no working accounts", () => {
    const nonWorking: Account = {
      ...checking,
      isWorking: false,
    };

    expect(computeHistoryStart([nonWorking], "2026-07-12")).toBe("2026-07-12");
  });
});
