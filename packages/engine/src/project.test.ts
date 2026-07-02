import { describe, it, expect } from "vitest";
import type { EngineInput } from "@cashflow/core";
import { projectCashFlow } from "./project.js";
import basicFixture from "../fixtures/basic-salary-rent.json";

describe("projectCashFlow", () => {
  it("returns projection result shape", () => {
    const result = projectCashFlow(basicFixture as EngineInput, "2026-06-01");

    expect(result.days.length).toBeGreaterThan(0);
    expect(result.workingBalanceTodayCents).toBe(500_000);
    expect(result).toHaveProperty("nextNegativeDate");
  });

  it("marks days below buffer when balance under threshold", () => {
    const input = {
      ...(basicFixture as EngineInput),
      settings: {
        ...(basicFixture as EngineInput).settings,
        negativeBufferCents: 600_000,
      },
    };
    const result = projectCashFlow(input, "2026-06-01");
    expect(result.days[0]?.belowBuffer).toBe(true);
    expect(result.nextNegativeDate).toBe("2026-06-01");
  });
});
