import { describe, it, expect } from "vitest";
import type { EngineInput } from "@cashflow/core";
import { getFixture } from "../fixtures/index.js";
import { projectCashFlow } from "./project.js";
import { dayOf, projectedItemsOnDate } from "./test-helpers.js";

describe("projection edge cases (US-1.8)", () => {
  describe("card purchase does not affect working balance on purchase date", () => {
    it("leaves aggregate working balance unchanged vs the prior day", () => {
      const fixture = getFixture("credit-card-cycle");
      const fromPriorDay = projectCashFlow(fixture, "2026-06-26");
      const fromPurchaseDay = projectCashFlow(fixture, "2026-06-27");

      const priorClosing = dayOf(fromPriorDay, "2026-06-26")?.closingBalanceCents;
      const purchaseDay = dayOf(fromPurchaseDay, "2026-06-27");

      expect(priorClosing).toBe(1_000_000);
      expect(purchaseDay?.openingBalanceCents).toBe(priorClosing);
      expect(purchaseDay?.outflowsCents).toBe(0);
      expect(purchaseDay?.closingBalanceCents).toBe(priorClosing);
    });
  });

  describe("statement payment on due date", () => {
    it("reduces working balance only on statement due dates", () => {
      const fixture = getFixture("credit-card-cycle");
      const result = projectCashFlow(fixture, "2026-06-27");

      const dayBeforeDue = dayOf(result, "2026-06-30");
      const firstDue = dayOf(result, "2026-07-01");
      const secondDue = dayOf(result, "2026-08-01");

      expect(dayBeforeDue?.closingBalanceCents).toBe(1_000_000);
      expect(firstDue?.outflowsCents).toBe(150_000);
      expect(firstDue?.closingBalanceCents).toBe(850_000);
      expect(secondDue?.outflowsCents).toBe(158_990);
      expect(secondDue?.closingBalanceCents).toBe(691_010);

      expect(
        projectedItemsOnDate(result, "2026-07-01", { source: "statement_payment" }),
      ).toHaveLength(1);
      expect(
        projectedItemsOnDate(result, "2026-08-01", { source: "statement_payment" }),
      ).toHaveLength(1);
    });
  });

  describe("re-anchor cutoff", () => {
    it("ignores transactions before the new anchor date", () => {
      const base = getFixture("basic-salary-rent");
      const preAnchorExpense = {
        id: "tx-pre-anchor",
        type: "expense" as const,
        amountCents: 100_000,
        accountId: "acct-checking",
        categoryId: "cat-other",
        description: "Expense before re-anchor",
        effectiveDate: "2026-06-05",
      };

      const withoutReanchor: EngineInput = {
        ...base,
        transactions: [preAnchorExpense],
      };

      const withReanchor: EngineInput = {
        ...withoutReanchor,
        accounts: [
          {
            ...base.accounts[0]!,
            anchorDate: "2026-06-10",
            anchorBalanceCents: 900_000,
          },
        ],
      };

      const baseline = projectCashFlow(withoutReanchor, "2026-06-10");
      const reanchored = projectCashFlow(withReanchor, "2026-06-10");

      expect(dayOf(baseline, "2026-06-10")?.openingBalanceCents).toBe(400_000);
      expect(dayOf(reanchored, "2026-06-10")?.openingBalanceCents).toBe(900_000);
      expect(reanchored.workingBalanceTodayCents).toBe(650_000);
    });
  });

  describe("transfer between working accounts (net zero on aggregate)", () => {
    it("debited source and credits destination without changing aggregate balance", () => {
      const base = getFixture("basic-salary-rent");
      const input: EngineInput = {
        ...base,
        accounts: [
          {
            ...base.accounts[0]!,
            id: "acct-primary",
            name: "Primary Checking",
            anchorBalanceCents: 500_000,
          },
          {
            id: "acct-secondary",
            name: "Secondary Checking",
            type: "checking",
            currency: "BRL",
            isWorking: true,
            anchorBalanceCents: 300_000,
            anchorDate: "2026-06-01",
          },
        ],
        plannedItems: [],
        transactions: [
          {
            id: "tx-internal-transfer",
            type: "transfer",
            amountCents: 100_000,
            accountId: "acct-primary",
            toAccountId: "acct-secondary",
            description: "Move funds between working accounts",
            effectiveDate: "2026-06-15",
          },
        ],
      };

      const result = projectCashFlow(input, "2026-06-15");
      const transferDay = dayOf(result, "2026-06-15");

      expect(transferDay?.openingBalanceCents).toBe(800_000);
      expect(transferDay?.inflowsCents).toBe(100_000);
      expect(transferDay?.outflowsCents).toBe(100_000);
      expect(transferDay?.closingBalanceCents).toBe(800_000);
      expect(result.workingBalanceTodayCents).toBe(800_000);
    });
  });

  describe("dormant / inactive exclusion", () => {
    it("excludes installments from inactive plans", () => {
      const fixture = getFixture("installment-plan");
      const result = projectCashFlow(fixture, "2026-06-03");

      expect(
        projectedItemsOnDate(result, "2026-08-01", { refId: "inst-loan-dormant-01" }),
      ).toHaveLength(0);
    });

    it("excludes inactive planned items from projection", () => {
      const base = getFixture("basic-salary-rent");
      const input: EngineInput = {
        ...base,
        plannedItems: [
          ...base.plannedItems,
          {
            id: "plan-inactive-bonus",
            type: "income",
            amountCents: 50_000,
            accountId: "acct-checking",
            categoryId: "cat-salary",
            description: "Inactive bonus",
            recurrence: "once",
            interval: 1,
            startDate: "2026-06-20",
            isSubscription: false,
            isActive: false,
          },
        ],
      };

      const result = projectCashFlow(input, "2026-06-01");

      expect(
        projectedItemsOnDate(result, "2026-06-20", { refId: "plan-inactive-bonus" }),
      ).toHaveLength(0);
      expect(dayOf(result, "2026-06-20")?.inflowsCents).toBe(0);
    });
  });
});
