import type { EngineInput } from "@cashflow/core";

export interface SettlementIndex {
  planned: Set<string>;
  installments: Set<string>;
  statements: Set<string>;
}

function plannedKey(plannedItemId: string, occurrenceDate: string): string {
  return `${plannedItemId}:${occurrenceDate}`;
}

/** Build lookup sets for settled forecast occurrences. */
export function buildSettlementIndex(input: EngineInput): SettlementIndex {
  const planned = new Set<string>();
  const installments = new Set<string>();
  const statements = new Set<string>();

  for (const tx of input.transactions) {
    if (tx.settlesPlannedItemId && tx.settlesPlannedOccurrenceDate) {
      planned.add(plannedKey(tx.settlesPlannedItemId, tx.settlesPlannedOccurrenceDate));
    }
    if (tx.settlesInstallmentId) {
      installments.add(tx.settlesInstallmentId);
    }
    if (tx.paysStatementId) {
      statements.add(tx.paysStatementId);
    }
  }

  for (const inst of input.installments) {
    if (inst.status === "paid" || inst.settledTransactionId) {
      installments.add(inst.id);
    }
  }

  for (const stmt of input.creditCardStatements) {
    if (stmt.status === "paid" || stmt.status === "partially_paid" || stmt.paymentTransactionId) {
      statements.add(stmt.id);
    }
  }

  return { planned, installments, statements };
}

export { plannedKey };
