import type { PlannedItemOverride } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export type PlannedItemOverrideInput = Omit<PlannedItemOverride, "id">;

export const plannedItemOverridesRepo = {
  async getAll(): Promise<PlannedItemOverride[]> {
    return [...getDatabase().plannedItemOverrides];
  },

  async getByPlannedItem(plannedItemId: string): Promise<PlannedItemOverride[]> {
    return getDatabase().plannedItemOverrides.filter((o) => o.plannedItemId === plannedItemId);
  },

  async upsert(input: PlannedItemOverrideInput): Promise<PlannedItemOverride> {
    const db = getDatabase();
    const index = db.plannedItemOverrides.findIndex(
      (o) => o.plannedItemId === input.plannedItemId && o.occurrenceDate === input.occurrenceDate,
    );

    if (index === -1) {
      const row: PlannedItemOverride = { ...input, id: crypto.randomUUID() };
      db.plannedItemOverrides.push(row);
      return row;
    }

    db.plannedItemOverrides[index] = { ...db.plannedItemOverrides[index], ...input };
    return db.plannedItemOverrides[index];
  },

  async skipOccurrence(
    plannedItemId: string,
    occurrenceDate: string,
  ): Promise<PlannedItemOverride> {
    return this.upsert({
      plannedItemId,
      occurrenceDate,
      status: "skipped",
    });
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const index = db.plannedItemOverrides.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`PlannedItemOverride not found: ${id}`);
    }
    db.plannedItemOverrides.splice(index, 1);
  },
};
