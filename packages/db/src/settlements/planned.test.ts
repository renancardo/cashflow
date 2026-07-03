import { describe, expect, it } from "vitest";
import { buildPlannedSettlementSet, todayIso } from "@cashflow/core";
import { createEmptyState, resetDatabase } from "../in-memory/database.js";
import { plannedItemsRepo } from "../repos/plannedItems.js";
import { transactionsRepo } from "../repos/transactions.js";
import { settlePlannedItem } from "./planned.js";

describe("settlePlannedItem", () => {
  it("creates a transaction linked to the planned occurrence", async () => {
    resetDatabase({
      ...createEmptyState(),
      accounts: [
        {
          id: "acct-1",
          name: "Checking",
          type: "checking",
          currency: "BRL",
          isWorking: true,
          anchorBalanceCents: 1_000_000,
          anchorDate: "2026-01-01",
        },
      ],
      categories: [
        {
          id: "cat-housing",
          name: "Housing",
          kind: "expense",
        },
      ],
    });

    const item = await plannedItemsRepo.create({
      type: "expense",
      amountCents: 240_000,
      accountId: "acct-1",
      categoryId: "cat-housing",
      description: "Aluguel",
      recurrence: "monthly",
      interval: 1,
      dayOfMonth: 10,
      startDate: "2026-01-10",
      isSubscription: false,
      isActive: true,
    });

    const occurrenceDate = "2026-07-10";
    const asOfDate = todayIso();
    const transaction = await settlePlannedItem(item.id, occurrenceDate, asOfDate);

    expect(transaction.settlesPlannedItemId).toBe(item.id);
    expect(transaction.settlesPlannedOccurrenceDate).toBe(occurrenceDate);
    expect(transaction.amountCents).toBe(240_000);
    expect(transaction.effectiveDate).toBe(asOfDate);

    const settled = buildPlannedSettlementSet(await transactionsRepo.getAll());
    expect(settled.has(`${item.id}:${occurrenceDate}`)).toBe(true);
  });

  it("clears settlement when the settling transaction is deleted", async () => {
    resetDatabase({
      ...createEmptyState(),
      accounts: [
        {
          id: "acct-1",
          name: "Checking",
          type: "checking",
          currency: "BRL",
          isWorking: true,
          anchorBalanceCents: 1_000_000,
          anchorDate: "2026-01-01",
        },
      ],
      categories: [
        {
          id: "cat-salary",
          name: "Salary",
          kind: "income",
        },
      ],
    });

    const item = await plannedItemsRepo.create({
      type: "income",
      amountCents: 850_000,
      accountId: "acct-1",
      categoryId: "cat-salary",
      description: "Salary",
      recurrence: "monthly",
      interval: 1,
      dayOfMonth: 5,
      startDate: "2026-01-05",
      isSubscription: false,
      isActive: true,
    });

    const occurrenceDate = "2026-07-05";
    const transaction = await settlePlannedItem(item.id, occurrenceDate, todayIso());

    let settled = buildPlannedSettlementSet(await transactionsRepo.getAll());
    expect(settled.has(`${item.id}:${occurrenceDate}`)).toBe(true);

    await transactionsRepo.delete(transaction.id);

    settled = buildPlannedSettlementSet(await transactionsRepo.getAll());
    expect(settled.has(`${item.id}:${occurrenceDate}`)).toBe(false);
    expect(await transactionsRepo.getAll()).toHaveLength(0);
  });
});
