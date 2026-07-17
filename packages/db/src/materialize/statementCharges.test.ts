import { describe, expect, it } from "vitest";
import { createEmptyState, resetDatabase } from "../in-memory/database.js";
import { accountsRepo } from "../repos/accounts.js";
import { creditCardStatementsRepo } from "../repos/creditCardStatements.js";
import { settleStatement } from "../settlements/statement.js";
import { transactionsRepo } from "../repos/transactions.js";
import { listStatementCharges, materializeStatementsForCard } from "./statements.js";

describe("listStatementCharges", () => {
  it("lists opening debt, actual charges, and projected planned items", async () => {
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
    const statements = materializeStatementsForCard(card.id, "2026-06-28");
    const firstDue = statements.find((row) => row.dueDate === "2026-07-01");
    const secondDue = statements.find((row) => row.dueDate === "2026-08-01");
    expect(firstDue).toBeDefined();
    expect(secondDue).toBeDefined();

    const openingCharges = listStatementCharges(firstDue!.id, "2026-06-28");
    expect(openingCharges).toEqual([
      expect.objectContaining({
        source: "opening_debt",
        description: "Opening balance",
        amountCents: 150_000,
        isProjected: false,
      }),
    ]);

    const purchaseCharges = listStatementCharges(secondDue!.id, "2026-06-28");
    expect(purchaseCharges).toEqual([
      expect.objectContaining({
        source: "transaction",
        description: "Online purchase",
        amountCents: 8_990,
        isProjected: false,
      }),
    ]);
    expect(purchaseCharges.reduce((sum, row) => sum + row.amountCents, 0)).toBe(
      secondDue!.computedTotalCents,
    );
  });

  it("lists carryover after a partial planned payment once the prior statement closes", async () => {
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

    materializeStatementsForCard(card.id, "2026-06-20");
    const firstDue = materializeStatementsForCard(card.id, "2026-06-20").find(
      (row) => row.dueDate === "2026-07-01",
    );
    expect(firstDue).toBeDefined();

    await creditCardStatementsRepo.update(firstDue!.id, { plannedPaymentCents: 100_000 });

    const secondDue = materializeStatementsForCard(card.id, "2026-06-27").find(
      (row) => row.dueDate === "2026-08-01",
    );
    expect(secondDue?.computedTotalCents).toBe(50_000);

    const charges = listStatementCharges(secondDue!.id, "2026-06-27");
    expect(charges).toEqual([
      expect.objectContaining({
        source: "carryover",
        amountCents: 50_000,
        isProjected: false,
      }),
    ]);
  });

  it("lists statement payments as credit line items", async () => {
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
    const firstDue = materializeStatementsForCard(card.id, "2026-06-28").find(
      (row) => row.dueDate === "2026-07-01",
    );
    expect(firstDue).toBeDefined();

    await creditCardStatementsRepo.update(firstDue!.id, { plannedPaymentCents: 100_000 });
    await settleStatement(firstDue!.id, "2026-06-30");

    const charges = listStatementCharges(firstDue!.id, "2026-06-30");
    expect(charges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "opening_debt",
          amountCents: 150_000,
        }),
        expect.objectContaining({
          source: "payment",
          amountCents: -100_000,
          isProjected: false,
        }),
      ]),
    );
  });
});
