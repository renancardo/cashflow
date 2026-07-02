import { describe, it, expect } from "vitest";
import {
  FIXTURE_CATALOG,
  assertEngineInputShape,
  fixtures,
  getFixture,
} from "../fixtures/index.js";
import { projectCashFlow } from "./project.js";

describe("fixture library", () => {
  it.each(FIXTURE_CATALOG.map((f) => [f.id, f]))(
    "%s validates as EngineInput",
    (id) => {
      const input = getFixture(id as keyof typeof fixtures);
      expect(input.accounts.length).toBeGreaterThan(0);
      expect(input.settings.horizonMonths).toBe(24);
      assertEngineInputShape(input);
    },
  );

  it("household-june-2026 has expected scale", () => {
    const input = getFixture("household-june-2026");
    expect(input.accounts).toHaveLength(7);
    expect(input.transactions.length).toBeGreaterThanOrEqual(30);
    expect(input.plannedItems.length).toBeGreaterThanOrEqual(10);
    expect(input.installmentPlans).toHaveLength(3);
    expect(input.creditCardStatements.length).toBeGreaterThanOrEqual(2);
  });

  it("household-june-2026 links card payment to statement", () => {
    const input = getFixture("household-june-2026");
    const payment = input.transactions.find((t) => t.paysStatementId);
    expect(payment?.amountCents).toBe(95_000);
    const stmt = input.creditCardStatements.find((s) => s.id === payment?.paysStatementId);
    expect(stmt?.paymentTransactionId).toBe(payment?.id);
  });

  it("all fixtures run through stub projectCashFlow", () => {
    for (const meta of FIXTURE_CATALOG) {
      const result = projectCashFlow(getFixture(meta.id as keyof typeof fixtures), meta.asOfDate);
      expect(result.days.length).toBeGreaterThan(0);
      expect(result).toHaveProperty("nextNegativeDate");
      expect(result).toHaveProperty("workingBalanceTodayCents");
    }
  });
});
