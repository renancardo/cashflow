import { describe, expect, it } from "vitest";
import { SEED_ANCHOR_DATE } from "../data/seed/bootstrap";
import { assertForwardDate, DEV_CLOCK_STORAGE_KEY, parseStoredClockToday } from "./devClockStorage";

describe("devClockStorage", () => {
  it("falls back to seed anchor for missing key", () => {
    expect(parseStoredClockToday(null)).toBe(SEED_ANCHOR_DATE);
  });

  it("returns sessionStorage forward position when set", () => {
    const stored = JSON.stringify({ today: "2026-08-01" });
    expect(parseStoredClockToday(stored)).toBe("2026-08-01");
  });

  it("falls back for invalid JSON", () => {
    expect(parseStoredClockToday("{not-json")).toBe(SEED_ANCHOR_DATE);
  });

  it("falls back for dates before seed anchor", () => {
    const stored = JSON.stringify({ today: "2026-01-01" });
    expect(parseStoredClockToday(stored)).toBe(SEED_ANCHOR_DATE);
  });

  it("rejects backward dates", () => {
    expect(assertForwardDate("2026-07-01", "2026-06-30")).toMatch(/before/i);
    expect(assertForwardDate("2026-07-01", "2026-07-01")).toBeNull();
    expect(assertForwardDate("2026-07-01", "2026-07-02")).toBeNull();
  });

  it("uses the dev clock storage key expected by the epic", () => {
    expect(DEV_CLOCK_STORAGE_KEY).toBe("cashflow:devClock");
  });
});
