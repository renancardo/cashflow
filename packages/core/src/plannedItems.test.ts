import { describe, expect, it } from "vitest";
import type { PlannedItem } from "./entities.js";
import { buildPlannedSettlementSet, previewForecastSchedule } from "./plannedItems.js";

const onceItem: PlannedItem = {
  id: "plan-quick-add",
  type: "expense",
  amountCents: 20_000_00,
  accountId: "checking",
  categoryId: "transport",
  description: "Quick add",
  recurrence: "once",
  interval: 1,
  startDate: "2026-07-11",
  isSubscription: false,
  isActive: true,
};

describe("previewForecastSchedule", () => {
  it("includes settled one-off items for the forecast expander", () => {
    const settled = buildPlannedSettlementSet([
      {
        id: "tx-1",
        type: "expense",
        amountCents: 20_000_00,
        accountId: "checking",
        categoryId: "transport",
        description: "Quick add",
        effectiveDate: "2026-07-11",
        sortOrder: 0,
        settlesPlannedItemId: onceItem.id,
        settlesPlannedOccurrenceDate: "2026-07-11",
      },
    ]);

    expect(
      previewForecastSchedule(onceItem, [], settled, "2026-07-03"),
    ).toEqual([
      {
        occurrenceDate: "2026-07-11",
        effectiveDate: "2026-07-11",
        amountCents: 20_000_00,
        isSettled: true,
      },
    ]);
  });

  it("keeps unsettled upcoming occurrences unsettled", () => {
    expect(previewForecastSchedule(onceItem, [], new Set(), "2026-07-03")).toEqual([
      {
        occurrenceDate: "2026-07-11",
        effectiveDate: "2026-07-11",
        amountCents: 20_000_00,
        isSettled: false,
      },
    ]);
  });
});
