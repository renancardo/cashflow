import type { Account } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";
import { randomId } from "../randomId.js";
import {
  materializeAllCreditCardStatements,
  materializeStatementsForCard,
  recomputeAllStatementTotals,
  recomputeStatementTotalsForCard,
} from "../materialize/statements.js";

function isCreditCard(account: Account): boolean {
  return account.type === "credit_card";
}

function creditCardCycleChanged(patch: Partial<Account>): boolean {
  return (
    patch.closingDay !== undefined ||
    patch.dueDay !== undefined ||
    patch.defaultPayFromAccountId !== undefined ||
    patch.anchorBalanceCents !== undefined ||
    patch.anchorDate !== undefined ||
    patch.type !== undefined
  );
}

export const accountsRepo = {
  async getAll(): Promise<Account[]> {
    return getDatabase().accounts.filter((a) => !a.archivedAt);
  },

  async getById(id: string): Promise<Account | null> {
    const account = getDatabase().accounts.find((a) => a.id === id && !a.archivedAt);
    return account ?? null;
  },

  async create(account: Omit<Account, "id">): Promise<Account> {
    const row: Account = { ...account, id: randomId() };
    getDatabase().accounts.push(row);

    if (isCreditCard(row)) {
      materializeStatementsForCard(row.id);
    }

    return row;
  },

  async update(id: string, patch: Partial<Account>): Promise<Account> {
    const db = getDatabase();
    const index = db.accounts.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Account not found: ${id}`);
    }

    const previous = db.accounts[index];
    db.accounts[index] = { ...previous, ...patch };
    const updated = db.accounts[index];

    if (isCreditCard(updated) && creditCardCycleChanged(patch)) {
      materializeStatementsForCard(updated.id);
    } else if (isCreditCard(updated)) {
      recomputeStatementTotalsForCard(updated.id);
    } else if (isCreditCard(previous) && !isCreditCard(updated)) {
      db.creditCardStatements = db.creditCardStatements.filter((row) => row.cardAccountId !== id);
    }

    return updated;
  },

  async archive(id: string): Promise<Account> {
    const today = new Date().toISOString().slice(0, 10);
    return this.update(id, { archivedAt: today });
  },
};

export { materializeAllCreditCardStatements, recomputeAllStatementTotals };
