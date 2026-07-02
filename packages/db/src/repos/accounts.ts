import type { Account } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export const accountsRepo = {
  async getAll(): Promise<Account[]> {
    return getDatabase().accounts.filter((a) => !a.archivedAt);
  },

  async getById(id: string): Promise<Account | null> {
    const account = getDatabase().accounts.find((a) => a.id === id && !a.archivedAt);
    return account ?? null;
  },

  async create(account: Omit<Account, "id">): Promise<Account> {
    const row: Account = { ...account, id: crypto.randomUUID() };
    getDatabase().accounts.push(row);
    return row;
  },

  async update(id: string, patch: Partial<Account>): Promise<Account> {
    const db = getDatabase();
    const index = db.accounts.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Account not found: ${id}`);
    }
    db.accounts[index] = { ...db.accounts[index], ...patch };
    return db.accounts[index];
  },

  async archive(id: string): Promise<Account> {
    const today = new Date().toISOString().slice(0, 10);
    return this.update(id, { archivedAt: today });
  },
};
