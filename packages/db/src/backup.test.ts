import { describe, it, expect, beforeEach } from "vitest";
import { exportDatabase, restoreDatabase, validateBackup, createEmptyBackup } from "./backup.js";
import { getDatabase, resetDatabase, seedDatabase } from "./in-memory/database.js";
import { DEFAULT_SETTINGS } from "@cashflow/core";

describe("backup", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("exports and restores all database entities", () => {
    seedDatabase({
      accounts: [
        {
          id: "acct-1",
          name: "Checking",
          type: "checking",
          currency: "BRL",
          isWorking: true,
          anchorBalanceCents: 100_000,
          anchorDate: "2026-01-01",
        },
      ],
      settings: { ...DEFAULT_SETTINGS, language: "en", negativeBufferCents: 500 },
    });

    const backup = exportDatabase();
    expect(backup.accounts).toHaveLength(1);
    expect(backup.settings.language).toBe("en");
    expect(validateBackup(backup)).toBe(true);

    resetDatabase();
    expect(getDatabase().accounts).toHaveLength(0);

    restoreDatabase(backup);
    expect(getDatabase().accounts[0]?.name).toBe("Checking");
    expect(getDatabase().settings.negativeBufferCents).toBe(500);
  });

  it("rejects invalid backup payloads", () => {
    expect(validateBackup(null)).toBe(false);
    expect(validateBackup({ version: 1 })).toBe(false);
    expect(validateBackup(createEmptyBackup())).toBe(true);
  });
});
