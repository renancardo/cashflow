import type { CategoryBudget } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export const categoryBudgetsRepo = {
  async getAll(): Promise<CategoryBudget[]> {
    return getDatabase().categoryBudgets.filter((b) => !b.archivedAt);
  },

  async getByCategoryId(categoryId: string): Promise<CategoryBudget[]> {
    return getDatabase().categoryBudgets.filter(
      (b) => b.categoryId === categoryId && !b.archivedAt,
    );
  },

  async create(budget: Omit<CategoryBudget, "id">): Promise<CategoryBudget> {
    const row: CategoryBudget = { ...budget, id: crypto.randomUUID() };
    getDatabase().categoryBudgets.push(row);
    return row;
  },

  async update(id: string, patch: Partial<CategoryBudget>): Promise<CategoryBudget> {
    const db = getDatabase();
    const index = db.categoryBudgets.findIndex((b) => b.id === id);
    if (index === -1) throw new Error(`CategoryBudget not found: ${id}`);
    db.categoryBudgets[index] = { ...db.categoryBudgets[index], ...patch };
    return db.categoryBudgets[index];
  },

  async upsertForMonth(
    categoryId: string,
    effectiveFromMonth: string,
    amountCents: number,
  ): Promise<CategoryBudget> {
    const db = getDatabase();
    const existing = db.categoryBudgets.find(
      (b) => b.categoryId === categoryId && b.effectiveFromMonth === effectiveFromMonth && !b.archivedAt,
    );
    if (existing) {
      return this.update(existing.id, { amountCents });
    }
    return this.create({ categoryId, effectiveFromMonth, amountCents });
  },

  async archive(id: string): Promise<CategoryBudget> {
    const today = new Date().toISOString().slice(0, 10);
    return this.update(id, { archivedAt: today });
  },
};
