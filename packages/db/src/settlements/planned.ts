import type { PlannedItem, Transaction } from "@cashflow/core";
import { buildPlannedSettlementSet, plannedSettlementKey } from "@cashflow/core";
import { plannedItemOverridesRepo } from "../repos/plannedItemOverrides.js";
import { plannedItemsRepo } from "../repos/plannedItems.js";
import { transactionsRepo } from "../repos/transactions.js";

function resolveOccurrenceAmount(
  item: PlannedItem,
  occurrenceDate: string,
  overrides: Awaited<ReturnType<typeof plannedItemOverridesRepo.getAll>>,
): number {
  const override = overrides.find(
    (row) => row.plannedItemId === item.id && row.occurrenceDate === occurrenceDate,
  );
  return override?.amountCentsOverride ?? item.amountCents;
}

/**
 * Records a planned item occurrence as settled by creating a ledger transaction.
 * Uses the given effective date so working balance updates immediately.
 */
export async function settlePlannedItem(
  plannedItemId: string,
  occurrenceDate: string,
  effectiveDate: string,
): Promise<Transaction> {
  const item = await plannedItemsRepo.getById(plannedItemId);
  if (!item) {
    throw new Error(`PlannedItem not found: ${plannedItemId}`);
  }

  const transactions = await transactionsRepo.getAll();
  const settled = buildPlannedSettlementSet(transactions);
  if (settled.has(plannedSettlementKey(plannedItemId, occurrenceDate))) {
    throw new Error(`Planned occurrence already settled: ${plannedItemId} @ ${occurrenceDate}`);
  }

  const overrides = await plannedItemOverridesRepo.getAll();
  const amountCents = resolveOccurrenceAmount(item, occurrenceDate, overrides);

  return transactionsRepo.create({
    type: item.type,
    amountCents,
    accountId: item.accountId,
    toAccountId: item.toAccountId,
    categoryId: item.categoryId,
    description: item.description,
    effectiveDate,
    settlesPlannedItemId: plannedItemId,
    settlesPlannedOccurrenceDate: occurrenceDate,
  });
}
