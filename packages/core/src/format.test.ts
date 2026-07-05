import { describe, it, expect } from "vitest";
import { formatDateWithPattern, formatMoney, todayIso } from "./format.js";

describe("format", () => {
  it("formats BRL cents for pt-BR", () => {
    expect(formatMoney(150_000, "pt-BR")).toContain("1.500");
  });

  it("returns ISO date for today", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formats dates with explicit patterns", () => {
    expect(formatDateWithPattern("2026-07-02", "DD/MM/YYYY")).toBe("02/07/2026");
    expect(formatDateWithPattern("2026-07-02", "MM/DD/YYYY")).toBe("07/02/2026");
    expect(formatDateWithPattern("2026-07-02", "YYYY-MM-DD")).toBe("2026-07-02");
  });
});
