import { describe, expect, it } from "vitest";
import {
  quickAddToPlannedItemInput,
  shouldRecordQuickAddAsTransaction,
  validateCalendarQuickAdd,
} from "./calendarQuickAdd";

describe("calendarQuickAdd", () => {
  const accounts = [
    { id: "checking", name: "Checking", type: "checking" as const },
    { id: "card", name: "Card", type: "credit_card" as const },
  ];

  it("maps quick-add values to a one-off planned item", () => {
    expect(
      quickAddToPlannedItemInput({
        type: "expense",
        amountCents: 2500,
        accountId: "checking",
        categoryId: "food",
        description: "Coffee",
        effectiveDate: "2026-07-03",
      }),
    ).toEqual({
      type: "expense",
      amountCents: 2500,
      accountId: "checking",
      categoryId: "food",
      description: "Coffee",
      recurrence: "once",
      interval: 1,
      startDate: "2026-07-03",
      isSubscription: false,
      isActive: true,
    });
  });

  it("rejects transfer to credit card", () => {
    expect(
      validateCalendarQuickAdd(
        {
          type: "transfer",
          amountCents: 1000,
          accountId: "checking",
          toAccountId: "card",
          description: "",
          effectiveDate: "2026-07-03",
        },
        accounts,
      ),
    ).toContain("statement payment");
  });

  it("uses a transaction for today or past and a planned item for future dates", () => {
    expect(shouldRecordQuickAddAsTransaction("2026-07-11", "2026-07-03")).toBe(false);
    expect(shouldRecordQuickAddAsTransaction("2026-07-03", "2026-07-03")).toBe(true);
    expect(shouldRecordQuickAddAsTransaction("2026-06-30", "2026-07-03")).toBe(true);
  });
});
