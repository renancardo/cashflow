import type { Transaction } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export const transactionsRepo = {
  async getAll(): Promise<Transaction[]> {
    return [...getDatabase().transactions];
  },

  async create(transaction: Omit<Transaction, "id">): Promise<Transaction> {
    const row: Transaction = { ...transaction, id: crypto.randomUUID() };
    getDatabase().transactions.push(row);
    return row;
  },
};
