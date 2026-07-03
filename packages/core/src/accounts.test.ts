import { describe, expect, it } from "vitest";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  accountTypeChipVariant,
  defaultIsWorking,
} from "./accounts.js";
import { formatCents, parseMoney } from "./format.js";

describe("accounts", () => {
  it("lists every account type with a label", () => {
    for (const type of ACCOUNT_TYPES) {
      expect(ACCOUNT_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it("maps credit cards to the card chip variant", () => {
    expect(accountTypeChipVariant("credit_card")).toBe("card");
    expect(accountTypeChipVariant("checking")).toBe("default");
  });

  it("excludes credit cards and investments from working balance by default", () => {
    expect(defaultIsWorking("checking")).toBe(true);
    expect(defaultIsWorking("credit_card")).toBe(false);
    expect(defaultIsWorking("investment")).toBe(false);
  });
});

describe("formatCents / parseMoney", () => {
  it("formats cents as a fixed two-decimal string", () => {
    expect(formatCents(185_000)).toBe("1850.00");
    expect(formatCents(undefined)).toBe("");
  });

  it("parses decimal strings into cents", () => {
    expect(parseMoney("1850.00")).toBe(185_000);
    expect(parseMoney("12,5")).toBe(1_250);
    expect(parseMoney("")).toBeUndefined();
    expect(parseMoney("abc")).toBeUndefined();
  });

  it("round-trips through format and parse", () => {
    expect(parseMoney(formatCents(845_000))).toBe(845_000);
  });
});
