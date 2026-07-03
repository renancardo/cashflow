import type { InstallmentPlan } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";
import {
  materializeInstallments,
  payoffDateForPlan,
  type InstallmentPlanInput,
} from "../materialize/installments.js";

export { type InstallmentPlanInput };

export const installmentPlansRepo = {
  async getAll(): Promise<InstallmentPlan[]> {
    return getDatabase().installmentPlans.filter((p) => !p.archivedAt);
  },

  async getById(id: string): Promise<InstallmentPlan | null> {
    const plan = getDatabase().installmentPlans.find((p) => p.id === id && !p.archivedAt);
    return plan ?? null;
  },

  async create(input: InstallmentPlanInput): Promise<InstallmentPlan> {
    const payoffDate = payoffDateForPlan(input);
    const row: InstallmentPlan = { ...input, payoffDate, id: crypto.randomUUID() };
    getDatabase().installmentPlans.push(row);
    materializeInstallments(row.id, input);
    return row;
  },

  async update(id: string, patch: Partial<InstallmentPlanInput>): Promise<InstallmentPlan> {
    const db = getDatabase();
    const index = db.installmentPlans.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`InstallmentPlan not found: ${id}`);
    }

    const current = db.installmentPlans[index];
    const merged: InstallmentPlanInput = {
      description: patch.description ?? current.description,
      accountId: patch.accountId ?? current.accountId,
      categoryId: patch.categoryId ?? current.categoryId,
      installmentAmountCents: patch.installmentAmountCents ?? current.installmentAmountCents,
      installmentCount: patch.installmentCount ?? current.installmentCount,
      firstDueDate: patch.firstDueDate ?? current.firstDueDate,
      dayOfMonth: patch.dayOfMonth ?? current.dayOfMonth,
      isActive: patch.isActive ?? current.isActive,
    };

    const payoffDate = payoffDateForPlan(merged);
    db.installmentPlans[index] = { ...current, ...patch, payoffDate };
    materializeInstallments(id, merged);
    return db.installmentPlans[index];
  },

  async setActive(id: string, isActive: boolean): Promise<InstallmentPlan> {
    return this.update(id, { isActive });
  },

  async archive(id: string): Promise<InstallmentPlan> {
    const db = getDatabase();
    const index = db.installmentPlans.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`InstallmentPlan not found: ${id}`);
    }
    const today = new Date().toISOString().slice(0, 10);
    db.installmentPlans[index] = {
      ...db.installmentPlans[index],
      archivedAt: today,
      isActive: false,
    };
    return db.installmentPlans[index];
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const index = db.installmentPlans.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`InstallmentPlan not found: ${id}`);
    }
    db.installmentPlans.splice(index, 1);
    db.installments = db.installments.filter((row) => row.installmentPlanId !== id);
  },
};
