import { describe, expect, it } from "vitest";
import { randomId } from "./randomId.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("randomId", () => {
  it("returns a UUID v4 string", () => {
    expect(randomId()).toMatch(UUID_RE);
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => randomId()));
    expect(ids.size).toBe(100);
  });

  it("falls back when crypto.randomUUID is unavailable", () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });

    try {
      expect(randomId()).toMatch(UUID_RE);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true });
    }
  });
});
