import type { PlannedItem } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";
import { recomputeAllStatementTotals } from "../materialize/statements.js";

export type PlannedItemInput = Omit<PlannedItem, "id" | "archivedAt">;

export const plannedItemsRepo = {
  async getAll(): Promise<PlannedItem[]> {
    return getDatabase().plannedItems.filter((p) => !p.archivedAt);
  },

  async getById(id: string): Promise<PlannedItem | null> {
    const item = getDatabase().plannedItems.find((p) => p.id === id && !p.archivedAt);
    return item ?? null;
  },

  async create(input: PlannedItemInput): Promise<PlannedItem> {
    const row: PlannedItem = { ...input, id: crypto.randomUUID() };
    getDatabase().plannedItems.push(row);
    recomputeAllStatementTotals();
    return row;
  },

  async update(id: string, patch: Partial<PlannedItemInput>): Promise<PlannedItem> {
    const db = getDatabase();
    const index = db.plannedItems.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`PlannedItem not found: ${id}`);
    }
    db.plannedItems[index] = { ...db.plannedItems[index], ...patch };
    recomputeAllStatementTotals();
    return db.plannedItems[index];
  },

  async setActive(id: string, isActive: boolean): Promise<PlannedItem> {
    return this.update(id, { isActive });
  },

  async archive(id: string): Promise<PlannedItem> {
    const db = getDatabase();
    const index = db.plannedItems.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`PlannedItem not found: ${id}`);
    }
    const today = new Date().toISOString().slice(0, 10);
    db.plannedItems[index] = { ...db.plannedItems[index], archivedAt: today, isActive: false };
    recomputeAllStatementTotals();
    return db.plannedItems[index];
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const index = db.plannedItems.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`PlannedItem not found: ${id}`);
    }
    db.plannedItems.splice(index, 1);
    db.plannedItemOverrides = db.plannedItemOverrides.filter((o) => o.plannedItemId !== id);
    recomputeAllStatementTotals();
  },
};
