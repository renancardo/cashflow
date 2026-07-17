import { describe, expect, it } from "vitest";
import { createEmptyState, getDatabase, resetDatabase } from "../in-memory/database.js";
import { accountsRepo } from "../repos/accounts.js";
import { transactionsRepo } from "../repos/transactions.js";
import {
  computeDueDate,
  generateStatementCycles,
  materializeStatementsForCard,
} from "./statements.js";

function statementsForCard(cardAccountId: string) {
  return getDatabase()
    .creditCardStatements.filter((row) => row.cardAccountId === cardAccountId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

describe("statement cycle dates", () => {
  it("places due date in the same month when dueDay > closingDay", () => {
    expect(computeDueDate("2026-06-10", 10, 15)).toBe("2026-06-15");
  });

  it("places due date in the following month when dueDay <= closingDay", () => {
    expect(computeDueDate("2026-06-26", 26, 1)).toBe("2026-07-01");
  });

  it("matches credit-card-cycle fixture periods", () => {
    const cycles = generateStatementCycles(26, 1, "2026-06-01", "2026-08-31");
    const junJul = cycles.find((cycle) => cycle.closingDate === "2026-06-26");
    const julAug = cycles.find((cycle) => cycle.closingDate === "2026-07-26");

    expect(junJul).toEqual({
      periodStart: "2026-05-27",
      closingDate: "2026-06-26",
      dueDate: "2026-07-01",
    });
    expect(julAug).toEqual({
      periodStart: "2026-06-27",
      closingDate: "2026-07-26",
      dueDate: "2026-08-01",
    });
  });
});

describe("statement materialization", () => {
  it("seeds opening debt and accrues purchases to the next statement", async () => {
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

    await transactionsRepo.create({
      type: "expense",
      amountCents: 8_990,
      accountId: card.id,
      categoryId: "cat-shopping",
      description: "Online purchase",
      effectiveDate: "2026-06-27",
    });

    materializeStatementsForCard(card.id, "2026-06-28");

    const statements = statementsForCard(card.id);
    const firstDue = statements.find((row) => row.dueDate === "2026-07-01");
    const secondDue = statements.find((row) => row.dueDate === "2026-08-01");

    expect(firstDue?.computedTotalCents).toBe(150_000);
    expect(secondDue?.computedTotalCents).toBe(8_990);
    expect(statements.length).toBeGreaterThanOrEqual(2);
  });

  it("materializes on credit card account create", async () => {
    resetDatabase(createEmptyState());

    const checking = await accountsRepo.create({
      name: "Checking",
      type: "checking",
      currency: "BRL",
      isWorking: true,
      anchorBalanceCents: 500_000,
      anchorDate: "2026-06-01",
    });

    const card = await accountsRepo.create({
      name: "Cartão Cora",
      type: "credit_card",
      currency: "BRL",
      isWorking: false,
      anchorBalanceCents: 185_000,
      anchorDate: "2026-06-01",
      closingDay: 25,
      dueDay: 3,
      defaultPayFromAccountId: checking.id,
    });

    const statements = statementsForCard(card.id);
    expect(statements.some((row) => row.dueDate === "2026-07-03")).toBe(true);
    expect(statements.find((row) => row.dueDate === "2026-07-03")?.computedTotalCents).toBe(
      185_000,
    );
  });

  it("materializes from anchor through anchor + horizonMonths only", async () => {
    resetDatabase(createEmptyState());

    const checking = await accountsRepo.create({
      name: "Checking",
      type: "checking",
      currency: "BRL",
      isWorking: true,
      anchorBalanceCents: 500_000,
      anchorDate: "2026-06-01",
    });

    const card = await accountsRepo.create({
      name: "Cartão Cora",
      type: "credit_card",
      currency: "BRL",
      isWorking: false,
      anchorBalanceCents: 185_000,
      anchorDate: "2026-06-01",
      closingDay: 25,
      dueDay: 3,
      defaultPayFromAccountId: checking.id,
    });

    materializeStatementsForCard(card.id, "2026-06-28");

    const statements = statementsForCard(card.id);
    expect(statements.length).toBeGreaterThan(0);
    expect(statements.every((row) => row.dueDate >= "2026-06-01")).toBe(true);
    expect(statements.every((row) => row.dueDate <= "2028-06-01")).toBe(true);
    expect(statements.some((row) => row.dueDate < "2026-07-01")).toBe(false);
  });

  it("preserves paid statements when rematerializing", async () => {
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
      anchorBalanceCents: 95_000,
      anchorDate: "2026-06-01",
      closingDay: 26,
      dueDay: 1,
      defaultPayFromAccountId: checking.id,
    });

    const paidStatement = statementsForCard(card.id).find((row) => row.dueDate === "2026-07-01");
    expect(paidStatement).toBeDefined();

    getDatabase().creditCardStatements = getDatabase().creditCardStatements.map((row) =>
      row.id === paidStatement!.id
        ? {
            ...row,
            status: "paid",
            paymentTransactionId: "tx-paid",
            computedTotalCents: 95_000,
          }
        : row,
    );

    materializeStatementsForCard(card.id, "2026-06-28");

    const preserved = getDatabase().creditCardStatements.find(
      (row) => row.id === paidStatement!.id,
    );
    expect(preserved?.status).toBe("paid");
    expect(preserved?.paymentTransactionId).toBe("tx-paid");
  });

  it("rolls unpaid remainder into the next statement after closingDate", async () => {
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

    await transactionsRepo.create({
      type: "expense",
      amountCents: 8_990,
      accountId: card.id,
      description: "Online purchase",
      effectiveDate: "2026-06-27",
    });

    materializeStatementsForCard(card.id, "2026-06-20");
    const first = statementsForCard(card.id).find((row) => row.dueDate === "2026-07-01");
    const secondBeforeClose = statementsForCard(card.id).find(
      (row) => row.dueDate === "2026-08-01",
    );
    expect(first?.computedTotalCents).toBe(150_000);
    // Prior statement has not closed yet — no carryover on next fatura
    expect(secondBeforeClose?.computedTotalCents).toBe(8_990);

    getDatabase().creditCardStatements = getDatabase().creditCardStatements.map((row) =>
      row.id === first!.id ? { ...row, plannedPaymentCents: 100_000 } : row,
    );
    materializeStatementsForCard(card.id, "2026-06-27");

    const secondAfterClose = statementsForCard(card.id).find((row) => row.dueDate === "2026-08-01");
    expect(secondAfterClose?.computedTotalCents).toBe(8_990 + 50_000);
  });

  it("carries underpayment even when status was incorrectly marked paid", async () => {
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
    const first = statementsForCard(card.id).find((row) => row.dueDate === "2026-07-01");
    expect(first?.computedTotalCents).toBe(150_000);

    // Mimic the old seed bug: force status=paid while paidAmount underpays.
    getDatabase().creditCardStatements = getDatabase().creditCardStatements.map((row) =>
      row.id === first!.id
        ? {
            ...row,
            status: "paid",
            paymentTransactionId: "tx-underpay",
            paidAmountCents: 100_000,
          }
        : row,
    );

    materializeStatementsForCard(card.id, "2026-06-28");
    const second = statementsForCard(card.id).find((row) => row.dueDate === "2026-08-01");
    expect(second?.computedTotalCents).toBe(50_000);
  });
});
