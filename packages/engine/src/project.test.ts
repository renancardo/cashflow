import { describe, it, expect } from "vitest";
import type { EngineInput } from "@cashflow/core";
import { FIXTURE_CATALOG, getFixture, type FixtureId } from "../fixtures/index.js";
import { projectCashFlow } from "./project.js";
import { dayOf, itemsOnDate, projectedItemsOnDate } from "./test-helpers.js";

function asOfFor(id: FixtureId): string {
  const meta = FIXTURE_CATALOG.find((f) => f.id === id);
  if (!meta) throw new Error(`Missing fixture meta for ${id}`);
  return meta.asOfDate;
}

describe("projectCashFlow", () => {
  describe("basic-salary-rent", () => {
    const fixture = getFixture("basic-salary-rent");
    const asOfDate = asOfFor("basic-salary-rent");

    it("returns projection result shape", () => {
      const result = projectCashFlow(fixture, asOfDate);

      expect(result.days.length).toBeGreaterThan(0);
      expect(result.workingBalanceTodayCents).toBe(500_000);
      expect(result).toHaveProperty("nextNegativeDate");
    });

    it("projects salary on day 5 and rent on day 10", () => {
      const result = projectCashFlow(fixture, asOfDate);

      const salaryDay = dayOf(result, "2026-06-05");
      expect(salaryDay?.inflowsCents).toBe(800_000);
      expect(salaryDay?.outflowsCents).toBe(0);
      expect(salaryDay?.closingBalanceCents).toBe(1_300_000);
      expect(projectedItemsOnDate(result, "2026-06-05", { refId: "plan-salary" })).toHaveLength(1);

      const rentDay = dayOf(result, "2026-06-10");
      expect(rentDay?.outflowsCents).toBe(250_000);
      expect(rentDay?.closingBalanceCents).toBe(1_050_000);
      expect(rentDay?.largeOutflow).toBe(true);
      expect(projectedItemsOnDate(result, "2026-06-10", { refId: "plan-rent" })).toHaveLength(1);
    });

    it("has no next negative date with default buffer", () => {
      const result = projectCashFlow(fixture, asOfDate);
      expect(result.nextNegativeDate).toBeNull();
    });

    it("marks days below buffer when balance under threshold", () => {
      const input: EngineInput = {
        ...fixture,
        settings: {
          ...fixture.settings,
          negativeBufferCents: 600_000,
        },
      };
      const result = projectCashFlow(input, asOfDate);
      expect(result.days[0]?.belowBuffer).toBe(true);
      expect(result.nextNegativeDate).toBe(asOfDate);
    });
  });

  describe("credit-card-cycle", () => {
    const fixture = getFixture("credit-card-cycle");
    const asOfDate = asOfFor("credit-card-cycle");

    it("keeps working balance unchanged on card purchase date", () => {
      const result = projectCashFlow(fixture, asOfDate);
      const purchaseDay = dayOf(result, "2026-06-27");

      expect(purchaseDay?.openingBalanceCents).toBe(1_000_000);
      expect(purchaseDay?.outflowsCents).toBe(0);
      expect(purchaseDay?.closingBalanceCents).toBe(1_000_000);
      expect(purchaseDay?.items).toHaveLength(0);
    });

    it("projects statement payments on due dates", () => {
      const result = projectCashFlow(fixture, asOfDate);

      const julPayment = dayOf(result, "2026-07-01");
      expect(julPayment?.outflowsCents).toBe(150_000);
      expect(julPayment?.closingBalanceCents).toBe(850_000);
      expect(projectedItemsOnDate(result, "2026-07-01", { source: "statement_payment" })).toEqual([
        expect.objectContaining({ refId: "stmt-jun-jul", amountCents: 150_000 }),
      ]);

      const augPayment = dayOf(result, "2026-08-01");
      expect(augPayment?.outflowsCents).toBe(158_990);
      expect(augPayment?.closingBalanceCents).toBe(691_010);
      expect(projectedItemsOnDate(result, "2026-08-01", { source: "statement_payment" })).toEqual([
        expect.objectContaining({ refId: "stmt-jul-aug", amountCents: 158_990 }),
      ]);
    });
  });

  describe("installment-plan", () => {
    const fixture = getFixture("installment-plan");
    const asOfDate = asOfFor("installment-plan");

    it("reflects paid June installments as actuals only", () => {
      const result = projectCashFlow(fixture, asOfDate);
      const jun3 = dayOf(result, "2026-06-03");

      expect(result.workingBalanceTodayCents).toBe(1_959_520);
      expect(jun3?.outflowsCents).toBe(40_480);
      expect(itemsOnDate(result, "2026-06-03", { source: "transaction" })).toHaveLength(2);
      expect(projectedItemsOnDate(result, "2026-06-03", { source: "installment" })).toHaveLength(0);
    });

    it("projects scheduled July installments on due dates", () => {
      const result = projectCashFlow(fixture, asOfDate);

      expect(projectedItemsOnDate(result, "2026-07-03", { refId: "inst-loan-beta-02" })).toEqual([
        expect.objectContaining({ amountCents: 22_433, source: "installment" }),
      ]);
      expect(dayOf(result, "2026-07-03")?.outflowsCents).toBe(22_433);

      expect(projectedItemsOnDate(result, "2026-07-10", { refId: "inst-loan-alpha-02" })).toEqual([
        expect.objectContaining({ amountCents: 18_047, source: "installment" }),
      ]);
      expect(dayOf(result, "2026-07-10")?.outflowsCents).toBe(18_047);
    });

    it("excludes dormant plan installments from projection", () => {
      const result = projectCashFlow(fixture, asOfDate);

      expect(projectedItemsOnDate(result, "2026-08-01", { source: "installment" })).toHaveLength(0);
      expect(itemsOnDate(result, "2026-08-01", { refId: "inst-loan-dormant-01" })).toHaveLength(0);
    });
  });

  describe("recurrence-overrides", () => {
    const fixture = getFixture("recurrence-overrides");
    const asOfDate = asOfFor("recurrence-overrides");

    it("skips July salary occurrence", () => {
      const result = projectCashFlow(fixture, asOfDate);

      expect(projectedItemsOnDate(result, "2026-07-08", { refId: "plan-salary" })).toHaveLength(0);
      expect(dayOf(result, "2026-07-08")?.inflowsCents).toBe(0);
    });

    it("applies modified August HOA amount", () => {
      const result = projectCashFlow(fixture, asOfDate);
      const augHoa = dayOf(result, "2026-08-12");

      expect(augHoa?.outflowsCents).toBe(123_511);
      expect(projectedItemsOnDate(result, "2026-08-12", { refId: "plan-hoa" })).toEqual([
        expect.objectContaining({ amountCents: 123_511 }),
      ]);
    });

    it("moves June streaming from the 15th to the 18th", () => {
      const result = projectCashFlow(fixture, asOfDate);

      expect(projectedItemsOnDate(result, "2026-06-15", { refId: "plan-streaming" })).toHaveLength(
        0,
      );
      expect(dayOf(result, "2026-06-15")?.outflowsCents).toBe(0);

      expect(projectedItemsOnDate(result, "2026-06-18", { refId: "plan-streaming" })).toEqual([
        expect.objectContaining({ amountCents: 5_590 }),
      ]);
      expect(dayOf(result, "2026-06-18")?.outflowsCents).toBe(5_590);
    });
  });

  describe("settlement-links", () => {
    const fixture = getFixture("settlement-links");
    const asOfDate = asOfFor("settlement-links");

    it("suppresses settled planned occurrences from duplicate projection", () => {
      const result = projectCashFlow(fixture, "2026-06-01");

      const jun8Items = itemsOnDate(result, "2026-06-08", { refId: "plan-support" });
      expect(jun8Items).toHaveLength(0);

      const jun12Items = itemsOnDate(result, "2026-06-12", { refId: "plan-hoa" });
      expect(jun12Items).toHaveLength(0);

      expect(itemsOnDate(result, "2026-06-08", { source: "transaction" })).toHaveLength(1);
      expect(itemsOnDate(result, "2026-06-12", { source: "transaction" })).toHaveLength(1);
    });

    it("suppresses paid installment from duplicate projection", () => {
      const result = projectCashFlow(fixture, "2026-06-01");

      expect(projectedItemsOnDate(result, "2026-06-03", { source: "installment" })).toHaveLength(0);
      expect(
        itemsOnDate(result, "2026-06-03", { source: "transaction", refId: "tx-loan-settled" }),
      ).toHaveLength(1);
    });

    it("suppresses paid statement from duplicate payment projection", () => {
      const result = projectCashFlow(fixture, asOfDate);

      expect(
        projectedItemsOnDate(result, "2026-07-01", { source: "statement_payment" }),
      ).toHaveLength(0);
      expect(dayOf(result, "2026-07-01")?.outflowsCents).toBe(0);

      expect(projectedItemsOnDate(result, "2026-08-01", { refId: "stmt-jul" })).toEqual([
        expect.objectContaining({ amountCents: 45_000, source: "statement_payment" }),
      ]);
    });

    it("still projects unsettled future occurrences", () => {
      const result = projectCashFlow(fixture, asOfDate);

      expect(projectedItemsOnDate(result, "2026-07-08", { refId: "plan-support" })).toHaveLength(1);
      expect(
        projectedItemsOnDate(result, "2026-07-10", { refId: "inst-loan-alpha-jul" }),
      ).toHaveLength(1);
      expect(projectedItemsOnDate(result, "2026-07-12", { refId: "plan-hoa" })).toHaveLength(1);
    });
  });

  describe("historical days before asOfDate", () => {
    const fixture = getFixture("household-june-2026");

    it("includes ledger history for days before the simulated date", () => {
      const result = projectCashFlow(fixture, "2026-07-12");

      const jul1 = dayOf(result, "2026-07-01");
      expect(jul1).toBeDefined();
      expect(jul1?.outflowsCents).toBeGreaterThan(0);
      expect(itemsOnDate(result, "2026-07-01", { source: "transaction" })).toHaveLength(2);

      const jul5 = dayOf(result, "2026-07-05");
      expect(jul5).toBeDefined();
      expect(jul5?.closingBalanceCents).toBe(jul1?.closingBalanceCents);

      const jul11 = dayOf(result, "2026-07-11");
      expect(jul11).toBeDefined();
      expect(jul11?.closingBalanceCents).toBe(jul1?.closingBalanceCents);
    });

    it("does not project forecast items before asOfDate", () => {
      const result = projectCashFlow(fixture, "2026-07-12");

      expect(projectedItemsOnDate(result, "2026-07-08", { refId: "plan-salary-a" })).toHaveLength(
        0,
      );
      expect(
        projectedItemsOnDate(result, "2026-07-10", { refId: "inst-loan-alpha-07" }),
      ).toHaveLength(0);
      expect(projectedItemsOnDate(result, "2026-07-12", { refId: "plan-hoa" })).toHaveLength(1);
    });

    it("keeps workingBalanceTodayCents on asOfDate", () => {
      const atJul12 = projectCashFlow(fixture, "2026-07-12");

      expect(atJul12.workingBalanceTodayCents).toBe(
        dayOf(atJul12, "2026-07-12")?.closingBalanceCents,
      );
    });

    it("only reports nextNegativeDate from asOfDate forward", () => {
      const fixture = getFixture("basic-salary-rent");
      const input: EngineInput = {
        ...fixture,
        settings: {
          ...fixture.settings,
          negativeBufferCents: 600_000,
        },
      };

      const result = projectCashFlow(input, "2026-06-10");

      expect(dayOf(result, "2026-06-01")?.belowBuffer).toBe(true);
      expect(result.nextNegativeDate).toBe("2026-06-10");
    });
  });
});
