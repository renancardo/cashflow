import { describe, it, expect } from "vitest";
import { formatMoney, todayIso } from "./format.js";

describe("format", () => {
  it("formats BRL cents for pt-BR", () => {
    expect(formatMoney(150_000, "pt-BR")).toContain("1.500");
  });

  it("returns ISO date for today", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
