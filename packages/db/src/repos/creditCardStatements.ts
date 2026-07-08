import { compareIso, todayIso } from "@cashflow/core";
import type { CreditCardStatement } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export const creditCardStatementsRepo = {
  async getAll(): Promise<CreditCardStatement[]> {
    return [...getDatabase().creditCardStatements];
  },

  async getById(id: string): Promise<CreditCardStatement | null> {
    const statement = getDatabase().creditCardStatements.find((row) => row.id === id);
    return statement ?? null;
  },

  async getByCardId(cardAccountId: string): Promise<CreditCardStatement[]> {
    return getDatabase()
      .creditCardStatements.filter((row) => row.cardAccountId === cardAccountId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  async update(id: string, patch: Partial<CreditCardStatement>): Promise<CreditCardStatement> {
    const db = getDatabase();
    const index = db.creditCardStatements.findIndex((row) => row.id === id);
    if (index === -1) {
      throw new Error(`CreditCardStatement not found: ${id}`);
    }

    db.creditCardStatements[index] = { ...db.creditCardStatements[index], ...patch };
    return db.creditCardStatements[index];
  },

  async markPaid(id: string, paymentTransactionId: string): Promise<CreditCardStatement> {
    return this.update(id, {
      status: "paid",
      paymentTransactionId,
    });
  },

  async markUnpaid(id: string, asOfDate?: string): Promise<CreditCardStatement> {
    const statement = await this.getById(id);
    if (!statement) {
      throw new Error(`CreditCardStatement not found: ${id}`);
    }

    const effectiveDate = asOfDate ?? todayIso();

    return this.update(id, {
      status: compareIso(statement.closingDate, effectiveDate) < 0 ? "closed" : "open",
      paymentTransactionId: undefined,
    });
  },
};
