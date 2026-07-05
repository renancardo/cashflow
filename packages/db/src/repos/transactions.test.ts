import { describe, it, expect, beforeEach } from "vitest";
import { resetDatabase, seedDatabase, transactionsRepo } from "../index.js";
import type { Transaction } from "@cashflow/core";

function tx(partial: Omit<Transaction, "sortOrder"> & { sortOrder?: number }): Transaction {
  return { sortOrder: 0, ...partial };
}

describe("transactionsRepo", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("sorts by effectiveDate desc then sortOrder asc", async () => {
    seedDatabase({
      transactions: [
        tx({
          id: "a",
          type: "expense",
          amountCents: 100,
          accountId: "acct",
          categoryId: "cat",
          description: "Later day, second",
          effectiveDate: "2026-06-10",
          sortOrder: 1,
        }),
        tx({
          id: "b",
          type: "expense",
          amountCents: 100,
          accountId: "acct",
          categoryId: "cat",
          description: "Later day, first",
          effectiveDate: "2026-06-10",
          sortOrder: 0,
        }),
        tx({
          id: "c",
          type: "expense",
          amountCents: 100,
          accountId: "acct",
          categoryId: "cat",
          description: "Earlier day",
          effectiveDate: "2026-06-05",
          sortOrder: 0,
        }),
      ],
    });

    const rows = await transactionsRepo.query();
    expect(rows.map((row) => row.id)).toEqual(["b", "a", "c"]);
  });

  it("assigns next sortOrder on create for the same effectiveDate", async () => {
    seedDatabase({
      transactions: [
        tx({
          id: "existing",
          type: "expense",
          amountCents: 100,
          accountId: "acct",
          categoryId: "cat",
          description: "Existing",
          effectiveDate: "2026-06-10",
          sortOrder: 2,
        }),
      ],
    });

    const created = await transactionsRepo.create({
      type: "expense",
      amountCents: 200,
      accountId: "acct",
      categoryId: "cat",
      description: "New",
      effectiveDate: "2026-06-10",
    });

    expect(created.sortOrder).toBe(3);
  });

  it("reorders transactions within the same effectiveDate", async () => {
    seedDatabase({
      transactions: [
        tx({
          id: "salary",
          type: "income",
          amountCents: 850_000,
          accountId: "acct",
          categoryId: "cat",
          description: "Salary",
          effectiveDate: "2026-06-05",
          sortOrder: 0,
        }),
        tx({
          id: "rent",
          type: "expense",
          amountCents: 240_000,
          accountId: "acct",
          categoryId: "cat",
          description: "Rent",
          effectiveDate: "2026-06-05",
          sortOrder: 1,
        }),
        tx({
          id: "other-day",
          type: "expense",
          amountCents: 100,
          accountId: "acct",
          categoryId: "cat",
          description: "Other day",
          effectiveDate: "2026-06-04",
          sortOrder: 0,
        }),
      ],
    });

    await transactionsRepo.reorderWithinDate("rent", "salary", "before");

    const rows = await transactionsRepo.query();
    expect(rows.filter((row) => row.effectiveDate === "2026-06-05").map((row) => row.id)).toEqual([
      "rent",
      "salary",
    ]);
    expect(rows.find((row) => row.id === "other-day")?.sortOrder).toBe(0);
  });

  it("rejects reorder across different dates", async () => {
    seedDatabase({
      transactions: [
        tx({
          id: "a",
          type: "expense",
          amountCents: 100,
          accountId: "acct",
          categoryId: "cat",
          description: "A",
          effectiveDate: "2026-06-05",
          sortOrder: 0,
        }),
        tx({
          id: "b",
          type: "expense",
          amountCents: 100,
          accountId: "acct",
          categoryId: "cat",
          description: "B",
          effectiveDate: "2026-06-04",
          sortOrder: 0,
        }),
      ],
    });

    await expect(transactionsRepo.reorderWithinDate("a", "b", "before")).rejects.toThrow(
      "Cannot reorder transactions across different dates",
    );
  });

  it("rejects transfer to credit card without paysStatementId", async () => {
    seedDatabase({
      accounts: [
        {
          id: "checking",
          name: "Checking",
          type: "checking",
          currency: "BRL",
          isWorking: true,
          anchorDate: "2026-01-01",
          anchorBalanceCents: 0,
        },
        {
          id: "card",
          name: "Card",
          type: "credit_card",
          currency: "BRL",
          isWorking: false,
          anchorDate: "2026-01-01",
          anchorBalanceCents: 0,
          closingDay: 26,
          dueDay: 1,
        },
      ],
    });

    await expect(
      transactionsRepo.create({
        type: "transfer",
        amountCents: 100_000,
        accountId: "checking",
        toAccountId: "card",
        description: "Manual card payment",
        effectiveDate: "2026-06-28",
      }),
    ).rejects.toThrow("statement payment");
  });

  it("allows transfer to credit card when paysStatementId is set", async () => {
    seedDatabase({
      accounts: [
        {
          id: "checking",
          name: "Checking",
          type: "checking",
          currency: "BRL",
          isWorking: true,
          anchorDate: "2026-01-01",
          anchorBalanceCents: 0,
        },
        {
          id: "card",
          name: "Card",
          type: "credit_card",
          currency: "BRL",
          isWorking: false,
          anchorDate: "2026-01-01",
          anchorBalanceCents: 0,
          closingDay: 26,
          dueDay: 1,
        },
      ],
    });

    const created = await transactionsRepo.create({
      type: "transfer",
      amountCents: 100_000,
      accountId: "checking",
      toAccountId: "card",
      description: "Statement payment",
      effectiveDate: "2026-06-28",
      paysStatementId: "stmt-1",
    });

    expect(created.paysStatementId).toBe("stmt-1");
  });
});
