import type { Settings } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export const settingsRepo = {
  async get(): Promise<Settings> {
    return { ...getDatabase().settings };
  },

  async update(patch: Partial<Settings>): Promise<Settings> {
    const db = getDatabase();
    db.settings = { ...db.settings, ...patch, id: "singleton" };
    return db.settings;
  },
};
