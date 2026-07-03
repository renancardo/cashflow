import type { Transaction, TxType } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export type TransactionQuery = {
  accountId?: string;
  categoryId?: string;
  type?: TxType;
  dateFrom?: string;
  dateTo?: string;
};

function matchesQuery(tx: Transaction, query: TransactionQuery): boolean {
  if (query.type && tx.type !== query.type) return false;

  if (query.accountId) {
    const touchesAccount =
      tx.accountId === query.accountId ||
      (tx.type === "transfer" && tx.toAccountId === query.accountId);
    if (!touchesAccount) return false;
  }

  if (query.categoryId && tx.categoryId !== query.categoryId) return false;

  if (query.dateFrom && tx.effectiveDate < query.dateFrom) return false;
  if (query.dateTo && tx.effectiveDate > query.dateTo) return false;

  return true;
}

export const transactionsRepo = {
  async getAll(): Promise<Transaction[]> {
    return [...getDatabase().transactions];
  },

  async getById(id: string): Promise<Transaction | null> {
    const transaction = getDatabase().transactions.find((t) => t.id === id);
    return transaction ?? null;
  },

  async query(filters: TransactionQuery = {}): Promise<Transaction[]> {
    return getDatabase()
      .transactions.filter((tx) => matchesQuery(tx, filters))
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate) || b.id.localeCompare(a.id));
  },

  async create(transaction: Omit<Transaction, "id">): Promise<Transaction> {
    const row: Transaction = { ...transaction, id: crypto.randomUUID() };
    getDatabase().transactions.push(row);
    return row;
  },

  async update(id: string, patch: Partial<Transaction>): Promise<Transaction> {
    const db = getDatabase();
    const index = db.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction not found: ${id}`);
    }
    db.transactions[index] = { ...db.transactions[index], ...patch };
    return db.transactions[index];
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const index = db.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction not found: ${id}`);
    }
    db.transactions.splice(index, 1);
  },
};
