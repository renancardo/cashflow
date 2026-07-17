import { describe, expect, it } from "vitest";
import { createEmptyState, resetDatabase } from "../in-memory/database.js";
import { accountsRepo } from "../repos/accounts.js";
import { creditCardStatementsRepo } from "../repos/creditCardStatements.js";
import { transactionsRepo } from "../repos/transactions.js";
import { materializeStatementsForCard } from "../materialize/statements.js";
import { settleStatement } from "./statement.js";

describe("settleStatement", () => {
  it("creates a transfer and marks the statement paid", async () => {
    resetDatabase(createEmptyState());

    const checking = await accountsRepo.create({
      name: "Checking",
      type: "checking",
      currency: "BRL",
      isWorking: true,
      anchorBalanceCents: 1_000_000,
      anchorDate: "2026-06-01",
    });

    const card = await accountsRepo.create({
      name: "Main Credit Card",
      type: "credit_card",
      currency: "BRL",
      isWorking: false,
      anchorBalanceCents: 150_000,
      anchorDate: "2026-06-01",
      closingDay: 26,
      dueDay: 1,
      defaultPayFromAccountId: checking.id,
    });

    materializeStatementsForCard(card.id, "2026-06-28");
    const statement = (await creditCardStatementsRepo.getByCardId(card.id)).find(
      (row) => row.dueDate === "2026-07-01",
    );
    expect(statement).toBeDefined();

    const result = await settleStatement(statement!.id, "2026-06-30");

    expect(result.statement.status).toBe("paid");
    expect(result.statement.paymentTransactionId).toBe(result.transaction.id);
    expect(result.transaction.type).toBe("transfer");
    expect(result.transaction.amountCents).toBe(150_000);
    expect(result.transaction.accountId).toBe(checking.id);
    expect(result.transaction.toAccountId).toBe(card.id);
    expect(result.transaction.paysStatementId).toBe(statement!.id);
  });

  it("uses plannedPaymentCents when set and marks partially_paid with carryover", async () => {
    resetDatabase(createEmptyState());

    const checking = await accountsRepo.create({
      name: "Checking",
      type: "checking",
      currency: "BRL",
      isWorking: true,
      anchorBalanceCents: 1_000_000,
      anchorDate: "2026-06-01",
    });

    const card = await accountsRepo.create({
      name: "Main Credit Card",
      type: "credit_card",
      currency: "BRL",
      isWorking: false,
      anchorBalanceCents: 150_000,
      anchorDate: "2026-06-01",
      closingDay: 26,
      dueDay: 1,
      defaultPayFromAccountId: checking.id,
    });

    materializeStatementsForCard(card.id, "2026-06-28");
    const statement = (await creditCardStatementsRepo.getByCardId(card.id)).find(
      (row) => row.dueDate === "2026-07-01",
    );

    await creditCardStatementsRepo.update(statement!.id, { plannedPaymentCents: 100_000 });

    const result = await settleStatement(statement!.id, "2026-06-30");
    expect(result.transaction.amountCents).toBe(100_000);
    expect(result.statement.status).toBe("partially_paid");
    expect(result.statement.paidAmountCents).toBe(100_000);
    expect(result.transaction.paysStatementId).toBe(statement!.id);

    const next = (await creditCardStatementsRepo.getByCardId(card.id)).find(
      (row) => row.dueDate === "2026-08-01",
    );
    expect(next?.computedTotalCents).toBe(50_000);
  });

  it("accepts an additional payment that finishes a partially_paid statement", async () => {
    resetDatabase(createEmptyState());

    const checking = await accountsRepo.create({
      name: "Checking",
      type: "checking",
      currency: "BRL",
      isWorking: true,
      anchorBalanceCents: 1_000_000,
      anchorDate: "2026-06-01",
    });

    const card = await accountsRepo.create({
      name: "Main Credit Card",
      type: "credit_card",
      currency: "BRL",
      isWorking: false,
      anchorBalanceCents: 150_000,
      anchorDate: "2026-06-01",
      closingDay: 26,
      dueDay: 1,
      defaultPayFromAccountId: checking.id,
    });

    materializeStatementsForCard(card.id, "2026-06-28");
    const statement = (await creditCardStatementsRepo.getByCardId(card.id)).find(
      (row) => row.dueDate === "2026-07-01",
    );

    await creditCardStatementsRepo.update(statement!.id, { plannedPaymentCents: 100_000 });
    await settleStatement(statement!.id, "2026-06-30");

    const second = await settleStatement(statement!.id, "2026-07-01", { amountCents: 50_000 });
    expect(second.transaction.amountCents).toBe(50_000);
    expect(second.statement.status).toBe("paid");
    expect(second.statement.paidAmountCents).toBe(150_000);

    const next = (await creditCardStatementsRepo.getByCardId(card.id)).find(
      (row) => row.dueDate === "2026-08-01",
    );
    expect(next?.computedTotalCents).toBe(0);
  });

  it("payRemaining settles the leftover balance on a partial statement", async () => {
    resetDatabase(createEmptyState());

    const checking = await accountsRepo.create({
      name: "Checking",
      type: "checking",
      currency: "BRL",
      isWorking: true,
      anchorBalanceCents: 1_000_000,
      anchorDate: "2026-06-01",
    });

    const card = await accountsRepo.create({
      name: "Main Credit Card",
      type: "credit_card",
      currency: "BRL",
      isWorking: false,
      anchorBalanceCents: 150_000,
      anchorDate: "2026-06-01",
      closingDay: 26,
      dueDay: 1,
      defaultPayFromAccountId: checking.id,
    });

    materializeStatementsForCard(card.id, "2026-06-28");
    const statement = (await creditCardStatementsRepo.getByCardId(card.id)).find(
      (row) => row.dueDate === "2026-07-01",
    );

    await creditCardStatementsRepo.update(statement!.id, { plannedPaymentCents: 40_000 });
    await settleStatement(statement!.id, "2026-06-30");

    const result = await settleStatement(statement!.id, "2026-07-01", { payRemaining: true });
    expect(result.transaction.amountCents).toBe(110_000);
    expect(result.statement.status).toBe("paid");
    expect(result.statement.paidAmountCents).toBe(150_000);
  });

  it("reverts statement to unpaid when the payment transaction is deleted", async () => {
    resetDatabase(createEmptyState());

    const checking = await accountsRepo.create({
      name: "Checking",
      type: "checking",
      currency: "BRL",
      isWorking: true,
      anchorBalanceCents: 1_000_000,
      anchorDate: "2026-06-01",
    });

    const card = await accountsRepo.create({
      name: "Main Credit Card",
      type: "credit_card",
      currency: "BRL",
      isWorking: false,
      anchorBalanceCents: 150_000,
      anchorDate: "2026-06-01",
      closingDay: 26,
      dueDay: 1,
      defaultPayFromAccountId: checking.id,
    });

    materializeStatementsForCard(card.id, "2026-06-28");
    const statement = (await creditCardStatementsRepo.getByCardId(card.id)).find(
      (row) => row.dueDate === "2026-07-01",
    );

    const { transaction } = await settleStatement(statement!.id, "2026-06-30");
    expect((await creditCardStatementsRepo.getById(statement!.id))?.status).toBe("paid");

    await transactionsRepo.delete(transaction.id);

    const reverted = await creditCardStatementsRepo.getById(statement!.id);
    expect(reverted?.status).toBe("closed");
    expect(reverted?.paymentTransactionId).toBeUndefined();
    expect(await transactionsRepo.getAll()).toHaveLength(0);
  });
});
