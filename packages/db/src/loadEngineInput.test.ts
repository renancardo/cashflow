import { describe, it, expect, beforeEach } from "vitest";
import { loadEngineInput, resetDatabase, seedDatabase } from "./index.js";

describe("loadEngineInput", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("returns empty engine input by default", async () => {
    const input = await loadEngineInput();
    expect(input.accounts).toEqual([]);
    expect(input.settings.id).toBe("singleton");
  });

  it("returns seeded accounts", async () => {
    seedDatabase({
      accounts: [
        {
          id: "a1",
          name: "Cora",
          type: "checking",
          currency: "BRL",
          isWorking: true,
          anchorBalanceCents: 100_000,
          anchorDate: "2026-06-01",
        },
      ],
    });

    const input = await loadEngineInput();
    expect(input.accounts).toHaveLength(1);
    expect(input.accounts[0]?.name).toBe("Cora");
  });
});
