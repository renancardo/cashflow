import type { StatementStatus } from "@cashflow/core";
import { fmt } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { useMessages } from "../../i18n/LanguageContext.js";
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
  paidAmountCents?: number;
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
  return row.status === "paid";
}

function isPartiallyPaid(row: StatementListRow): boolean {
  return row.status === "partially_paid";
}

function remainingCents(row: StatementListRow): number {
  return Math.max(0, row.computedTotalCents - (row.paidAmountCents ?? 0));
}

function hasPaymentOverride(row: StatementListRow): boolean {
  return row.plannedPaymentCents != null;
}

function isPartialPayment(row: StatementListRow): boolean {
  if (isPaid(row)) return false;
  if (isPartiallyPaid(row)) return true;
  return row.plannedPaymentCents != null && row.plannedPaymentCents < row.computedTotalCents;
}

function statusLabel(m: ReturnType<typeof useMessages>, row: StatementListRow): string {
  if (isPaid(row)) return m.common.paid;
  if (isPartialPayment(row)) return m.common.partial;
  if (row.status === "closed") return m.common.closed;
  return m.common.open;
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
  const m = useMessages();
  const h = m.statements.headers;
  const horizonSuffix =
    statements.length === 1 ? m.statements.countInHorizonOne : m.statements.countInHorizonMany;

  return (
    <div
      className={[styles.overlay, open && styles.open].filter(Boolean).join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label={m.common.aria.closeStatements}
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
                {cardName} {m.statements.listTitleSuffix}
              </h2>
              <p className={styles.subtitle}>
                {fmt(m.statements.countInHorizon, {
                  count: statements.length,
                  suffix: horizonSuffix,
                })}
              </p>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label={m.common.aria.closeStatements}
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        <div className={styles.body}>
          {statements.length === 0 ? (
            <p className={styles.empty}>{m.statements.empty}</p>
          ) : (
            <div className={styles.table} role="table" aria-label={m.statements.tableAria}>
              <div className={styles.tableHeader} role="row">
                <span role="columnheader">{h.period}</span>
                <span role="columnheader">{h.close}</span>
                <span role="columnheader">{h.due}</span>
                <span role="columnheader">{h.remaining}</span>
                <span role="columnheader">{h.status}</span>
                <span role="columnheader" aria-hidden />
              </div>

              {statements.map((row) => {
                const paid = isPaid(row);
                const partial = isPartiallyPaid(row);

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
                    <span className={styles.colRemaining} role="cell">
                      <span className={styles.remainingCell}>
                        <MoneyAmount cents={remainingCents(row)} />
                        {hasPaymentOverride(row) && !paid && !partial && (
                          <Chip variant="statement">{m.common.override}</Chip>
                        )}
                      </span>
                    </span>
                    <span className={styles.colStatus} role="cell">
                      <span className={styles.statusCell}>
                        {paid || partial ? (
                          <>
                            <Chip variant={paid ? "actual" : "statement"}>
                              {paid ? m.common.paidCheck : m.common.partial}
                            </Chip>
                            {row.paymentTransactionId && onNavigateToTransaction && (
                              <button
                                type="button"
                                className={styles.paidLink}
                                onClick={() => onNavigateToTransaction(row.paymentTransactionId!)}
                              >
                                {m.statements.view}
                              </button>
                            )}
                          </>
                        ) : (
                          <Chip
                            variant={
                              isPartialPayment(row)
                                ? "statement"
                                : row.status === "closed"
                                  ? "default"
                                  : "statement"
                            }
                          >
                            {statusLabel(m, row)}
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
                          {m.statements.items}
                        </Button>
                      )}
                      {!paid && onEdit && (
                        <Button
                          variant="ghost"
                          className={styles.editButton}
                          onClick={() => onEdit(row.id)}
                        >
                          {m.statements.edit}
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
