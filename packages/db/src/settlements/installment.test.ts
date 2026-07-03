import { describe, expect, it } from "vitest";
import { todayIso } from "@cashflow/core";
import { createEmptyState, resetDatabase } from "../in-memory/database.js";
import { installmentPlansRepo } from "../repos/installmentPlans.js";
import { installmentsRepo } from "../repos/installments.js";
import { transactionsRepo } from "../repos/transactions.js";
import { settleInstallment } from "./installment.js";

describe("settleInstallment", () => {
  it("creates a transaction and marks the installment paid", async () => {
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
    });

    const plan = await installmentPlansRepo.create({
      description: "Ipanema",
      accountId: "acct-1",
      categoryId: "cat-debt",
      installmentAmountCents: 47_500,
      installmentCount: 3,
      firstDueDate: "2026-07-10",
      dayOfMonth: 10,
      isActive: true,
    });

    const rows = await installmentsRepo.getByPlanId(plan.id);
    const target = rows.find((row) => row.status === "scheduled");
    expect(target).toBeDefined();

    const asOfDate = todayIso();
    const result = await settleInstallment(target!.id, asOfDate);

    expect(result.installment.status).toBe("paid");
    expect(result.installment.settledTransactionId).toBe(result.transaction.id);
    expect(result.transaction.settlesInstallmentId).toBe(target!.id);
    expect(result.transaction.amountCents).toBe(47_500);
    expect(result.transaction.effectiveDate).toBe(asOfDate);

    const transactions = await transactionsRepo.getAll();
    expect(transactions).toHaveLength(1);
  });

  it("reverts installment to scheduled when the settling transaction is deleted", async () => {
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
    });

    const plan = await installmentPlansRepo.create({
      description: "Ipanema",
      accountId: "acct-1",
      installmentAmountCents: 47_500,
      installmentCount: 3,
      firstDueDate: "2026-07-10",
      dayOfMonth: 10,
      isActive: true,
    });

    const rows = await installmentsRepo.getByPlanId(plan.id);
    const target = rows[0];

    const { transaction } = await settleInstallment(target.id, todayIso());
    let updated = await installmentsRepo.getById(target.id);
    expect(updated?.status).toBe("paid");

    await transactionsRepo.delete(transaction.id);

    updated = await installmentsRepo.getById(target.id);
    expect(updated?.status).toBe("scheduled");
    expect(updated?.settledTransactionId).toBeUndefined();
    expect(await transactionsRepo.getAll()).toHaveLength(0);
  });
});
