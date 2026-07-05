import type { StatementStatus } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import {
  formatShortDate,
  formatShortDateWithYear,
  formatStatementPeriod,
} from "../../lib/statementDates.js";
import styles from "./StatementListPanel.module.css";

export type StatementListRow = {
  id: string;
  periodStart: string;
  closingDate: string;
  dueDate: string;
  computedTotalCents: number;
  plannedPaymentCents?: number;
  status: StatementStatus;
  paymentTransactionId?: string;
};

type Props = {
  open: boolean;
  cardName: string;
  statements: StatementListRow[];
  onClose: () => void;
  onEdit?: (statementId: string) => void;
  onNavigateToTransaction?: (transactionId: string) => void;
  onViewItems?: (statementId: string) => void;
};

function isPaid(row: StatementListRow): boolean {
  return row.status === "paid" || Boolean(row.paymentTransactionId);
}

function payAmountCents(row: StatementListRow): number {
  return row.plannedPaymentCents ?? row.computedTotalCents;
}

function hasPaymentOverride(row: StatementListRow): boolean {
  return row.plannedPaymentCents != null;
}

function isPartialPayment(row: StatementListRow): boolean {
  if (isPaid(row)) return false;
  return row.plannedPaymentCents != null && row.plannedPaymentCents < row.computedTotalCents;
}

function statusLabel(row: StatementListRow): string {
  if (isPaid(row)) return "paid";
  if (isPartialPayment(row)) return "partial";
  return row.status;
}

function PeriodRange({
  periodStart,
  closingDate,
}: Pick<StatementListRow, "periodStart" | "closingDate">) {
  const label = formatStatementPeriod(periodStart, closingDate);

  return (
    <span className={styles.period} title={label}>
      <span>{formatShortDate(periodStart)}</span>
      <span className={styles.periodSep} aria-hidden>
        –
      </span>
      <span>{formatShortDateWithYear(closingDate)}</span>
    </span>
  );
}

export function StatementListPanel({
  open,
  cardName,
  statements,
  onClose,
  onEdit,
  onNavigateToTransaction,
  onViewItems,
}: Props) {
  return (
    <div
      className={[styles.overlay, open && styles.open].filter(Boolean).join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close statements"
        onClick={onClose}
      />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="statement-list-title"
      >
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h2 className={styles.title} id="statement-list-title">
                {cardName} — Statements
              </h2>
              <p className={styles.subtitle}>
                {statements.length} statement{statements.length === 1 ? "" : "s"} in horizon
              </p>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Close statements"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        <div className={styles.body}>
          {statements.length === 0 ? (
            <p className={styles.empty}>No statements materialized for this card yet.</p>
          ) : (
            <div className={styles.table} role="table" aria-label="Credit card statements">
              <div className={styles.tableHeader} role="row">
                <span role="columnheader">Period</span>
                <span role="columnheader">Close</span>
                <span role="columnheader">Due</span>
                <span role="columnheader">Total</span>
                <span role="columnheader">Pay</span>
                <span role="columnheader">Status</span>
                <span role="columnheader" aria-hidden />
              </div>

              {statements.map((row) => {
                const paid = isPaid(row);
                const partial = isPartialPayment(row);

                return (
                  <div key={row.id} className={styles.tableRow} role="row">
                    <span className={styles.colPeriod} role="cell">
                      <PeriodRange periodStart={row.periodStart} closingDate={row.closingDate} />
                    </span>
                    <span className={styles.colClose} role="cell">
                      <time dateTime={row.closingDate}>{formatShortDate(row.closingDate)}</time>
                    </span>
                    <span className={styles.colDue} role="cell">
                      <time dateTime={row.dueDate}>{formatShortDate(row.dueDate)}</time>
                    </span>
                    <span className={styles.colTotal} role="cell">
                      <MoneyAmount cents={row.computedTotalCents} />
                    </span>
                    <span className={styles.colPay} role="cell">
                      <span className={styles.payCell}>
                        <MoneyAmount cents={payAmountCents(row)} />
                        {hasPaymentOverride(row) && !paid && (
                          <Chip variant="statement">Override</Chip>
                        )}
                      </span>
                    </span>
                    <span className={styles.colStatus} role="cell">
                      <span className={styles.statusCell}>
                        {paid ? (
                          <>
                            <Chip variant="actual">paid ✓</Chip>
                            {row.paymentTransactionId && onNavigateToTransaction && (
                              <button
                                type="button"
                                className={styles.paidLink}
                                onClick={() => onNavigateToTransaction(row.paymentTransactionId!)}
                              >
                                View
                              </button>
                            )}
                          </>
                        ) : partial ? (
                          <Chip variant="statement">{statusLabel(row)}</Chip>
                        ) : (
                          <Chip variant={row.status === "closed" ? "default" : "statement"}>
                            {statusLabel(row)}
                          </Chip>
                        )}
                      </span>
                    </span>
                    <span className={styles.colActions} role="cell">
                      {onViewItems && (
                        <Button
                          variant="ghost"
                          className={styles.editButton}
                          onClick={() => onViewItems(row.id)}
                        >
                          Items
                        </Button>
                      )}
                      {!paid && onEdit && (
                        <Button
                          variant="ghost"
                          className={styles.editButton}
                          onClick={() => onEdit(row.id)}
                        >
                          Edit
                        </Button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
