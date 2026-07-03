import { describe, expect, it } from "vitest";
import { createEmptyState, resetDatabase } from "../in-memory/database.js";
import { installmentPlansRepo } from "../repos/installmentPlans.js";
import { installmentsRepo } from "../repos/installments.js";

describe("installment materialization", () => {
  it("eager-generates rows and preserves paid installments on update", async () => {
    resetDatabase(createEmptyState());

    const plan = await installmentPlansRepo.create({
      description: "Loan Alpha",
      accountId: "acct-1",
      installmentAmountCents: 10_000,
      installmentCount: 3,
      firstDueDate: "2026-06-10",
      dayOfMonth: 10,
      isActive: true,
    });

    let rows = await installmentsRepo.getByPlanId(plan.id);
    expect(rows).toHaveLength(3);
    expect(rows[0].dueDate).toBe("2026-06-10");
    expect(rows[2].dueDate).toBe("2026-08-10");
    expect(plan.payoffDate).toBe("2026-08-10");

    await installmentsRepo.markPaid(rows[0].id, "tx-1");

    await installmentPlansRepo.update(plan.id, { installmentCount: 4 });

    rows = await installmentsRepo.getByPlanId(plan.id);
    expect(rows).toHaveLength(4);
    expect(rows[0].status).toBe("paid");
    expect(rows[3].dueDate).toBe("2026-09-10");
  });

  it("rejects count below highest paid index", async () => {
    resetDatabase(createEmptyState());

    const plan = await installmentPlansRepo.create({
      description: "Loan Beta",
      accountId: "acct-1",
      installmentAmountCents: 5_000,
      installmentCount: 3,
      firstDueDate: "2026-06-03",
      dayOfMonth: 3,
      isActive: true,
    });

    const rows = await installmentsRepo.getByPlanId(plan.id);
    await installmentsRepo.markPaid(rows[1].id);

    await expect(installmentPlansRepo.update(plan.id, { installmentCount: 1 })).rejects.toThrow(
      /highest paid index/,
    );
  });
});
