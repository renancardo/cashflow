import type { Category } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export const categoriesRepo = {
  async getAll(): Promise<Category[]> {
    return getDatabase().categories.filter((c) => !c.archivedAt);
  },

  async getById(id: string): Promise<Category | null> {
    const category = getDatabase().categories.find((c) => c.id === id && !c.archivedAt);
    return category ?? null;
  },

  async create(category: Omit<Category, "id">): Promise<Category> {
    const row: Category = { ...category, id: crypto.randomUUID() };
    getDatabase().categories.push(row);
    return row;
  },

  async update(id: string, patch: Partial<Category>): Promise<Category> {
    const db = getDatabase();
    const index = db.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Category not found: ${id}`);
    db.categories[index] = { ...db.categories[index], ...patch };
    return db.categories[index];
  },

  async archive(id: string): Promise<Category> {
    const today = new Date().toISOString().slice(0, 10);
    return this.update(id, { archivedAt: today });
  },
};
