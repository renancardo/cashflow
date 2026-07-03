import type { Installment } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";

export const installmentsRepo = {
  async getAll(): Promise<Installment[]> {
    return [...getDatabase().installments];
  },

  async getByPlanId(planId: string): Promise<Installment[]> {
    return getDatabase()
      .installments.filter((row) => row.installmentPlanId === planId)
      .sort((a, b) => a.index - b.index);
  },

  async getById(id: string): Promise<Installment | null> {
    const row = getDatabase().installments.find((i) => i.id === id);
    return row ?? null;
  },

  async markPaid(id: string, settledTransactionId?: string): Promise<Installment> {
    const db = getDatabase();
    const index = db.installments.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Installment not found: ${id}`);
    }
    db.installments[index] = {
      ...db.installments[index],
      status: "paid",
      settledTransactionId,
    };
    return db.installments[index];
  },

  async markScheduled(id: string): Promise<Installment> {
    const db = getDatabase();
    const index = db.installments.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Installment not found: ${id}`);
    }
    db.installments[index] = {
      ...db.installments[index],
      status: "scheduled",
      settledTransactionId: undefined,
    };
    return db.installments[index];
  },

  async setAmountOverride(
    id: string,
    amountCentsOverride: number | undefined,
  ): Promise<Installment> {
    const db = getDatabase();
    const index = db.installments.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Installment not found: ${id}`);
    }
    db.installments[index] = { ...db.installments[index], amountCentsOverride };
    return db.installments[index];
  },
};
