import type { Transaction, TxType } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";
import { randomId } from "../randomId.js";
import { recomputeAllStatementTotals } from "../materialize/statements.js";
import { assertValidTransaction } from "../validate/transaction.js";
import { creditCardStatementsRepo } from "./creditCardStatements.js";
import { installmentsRepo } from "./installments.js";

export type TransactionQuery = {
  accountId?: string;
  categoryId?: string;
  type?: TxType;
  dateFrom?: string;
  dateTo?: string;
};

export type ReorderPosition = "before" | "after";

function compareTransactions(a: Transaction, b: Transaction): number {
  const dateCmp = b.effectiveDate.localeCompare(a.effectiveDate);
  if (dateCmp !== 0) return dateCmp;
  return a.sortOrder - b.sortOrder;
}

function nextSortOrderForDate(effectiveDate: string): number {
  const sameDay = getDatabase().transactions.filter((tx) => tx.effectiveDate === effectiveDate);
  if (sameDay.length === 0) return 0;
  return Math.max(...sameDay.map((tx) => tx.sortOrder)) + 1;
}

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
    return [...getDatabase().transactions].sort(compareTransactions);
  },

  async getById(id: string): Promise<Transaction | null> {
    const transaction = getDatabase().transactions.find((t) => t.id === id);
    return transaction ?? null;
  },

  async query(filters: TransactionQuery = {}): Promise<Transaction[]> {
    return getDatabase()
      .transactions.filter((tx) => matchesQuery(tx, filters))
      .sort(compareTransactions);
  },

  async create(
    transaction: Omit<Transaction, "id" | "sortOrder"> & { sortOrder?: number },
  ): Promise<Transaction> {
    await assertValidTransaction(transaction);
    const sortOrder = transaction.sortOrder ?? nextSortOrderForDate(transaction.effectiveDate);
    const row: Transaction = { ...transaction, sortOrder, id: randomId() };
    getDatabase().transactions.push(row);
    recomputeAllStatementTotals();
    return row;
  },

  async update(id: string, patch: Partial<Transaction>): Promise<Transaction> {
    const db = getDatabase();
    const index = db.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction not found: ${id}`);
    }

    const current = db.transactions[index];
    const nextPatch = { ...patch };

    if (
      patch.effectiveDate &&
      patch.effectiveDate !== current.effectiveDate &&
      patch.sortOrder === undefined
    ) {
      nextPatch.sortOrder = nextSortOrderForDate(patch.effectiveDate);
    }

    const next = { ...current, ...nextPatch };
    await assertValidTransaction(next);
    db.transactions[index] = next;
    recomputeAllStatementTotals();
    return db.transactions[index];
  },

  async reorderWithinDate(
    draggedId: string,
    targetId: string,
    position: ReorderPosition,
  ): Promise<Transaction[]> {
    const db = getDatabase();
    const dragged = db.transactions.find((t) => t.id === draggedId);
    const target = db.transactions.find((t) => t.id === targetId);

    if (!dragged) {
      throw new Error(`Transaction not found: ${draggedId}`);
    }
    if (!target) {
      throw new Error(`Transaction not found: ${targetId}`);
    }
    if (dragged.effectiveDate !== target.effectiveDate) {
      throw new Error("Cannot reorder transactions across different dates");
    }

    const sameDay = db.transactions
      .filter((tx) => tx.effectiveDate === dragged.effectiveDate)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const withoutDragged = sameDay.filter((tx) => tx.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((tx) => tx.id === targetId);
    if (targetIndex === -1) {
      throw new Error(`Target transaction not found on ${dragged.effectiveDate}`);
    }

    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
    const reordered = [
      ...withoutDragged.slice(0, insertIndex),
      dragged,
      ...withoutDragged.slice(insertIndex),
    ];

    const updated: Transaction[] = [];
    for (const [index, tx] of reordered.entries()) {
      const rowIndex = db.transactions.findIndex((row) => row.id === tx.id);
      db.transactions[rowIndex] = { ...db.transactions[rowIndex], sortOrder: index };
      updated.push(db.transactions[rowIndex]);
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const index = db.transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction not found: ${id}`);
    }

    const tx = db.transactions[index];
    const installmentId =
      tx.settlesInstallmentId ?? db.installments.find((row) => row.settledTransactionId === id)?.id;
    const statementId =
      tx.paysStatementId ??
      db.creditCardStatements.find((row) => row.paymentTransactionId === id)?.id;

    if (installmentId) {
      await installmentsRepo.markScheduled(installmentId);
    }

    db.transactions.splice(index, 1);

    if (statementId) {
      const remainingPayments = db.transactions.filter((row) => row.paysStatementId === statementId);
      const paidAmountCents = remainingPayments.reduce((sum, row) => sum + row.amountCents, 0);
      const latestPayment = remainingPayments.sort((a, b) =>
        b.effectiveDate.localeCompare(a.effectiveDate),
      )[0];
      const statement = db.creditCardStatements.find((row) => row.id === statementId);

      if (!latestPayment || paidAmountCents <= 0) {
        await creditCardStatementsRepo.markUnpaid(statementId);
      } else if (statement && paidAmountCents >= statement.computedTotalCents) {
        await creditCardStatementsRepo.markPaid(statementId, latestPayment.id, paidAmountCents);
      } else {
        await creditCardStatementsRepo.markPartiallyPaid(
          statementId,
          latestPayment.id,
          paidAmountCents,
        );
      }
    }

    recomputeAllStatementTotals();
  },
};
