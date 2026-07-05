import { useState } from "react";
import type { StatementStatus } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import { formatStatementPeriod } from "../../lib/statementDates.js";
import styles from "./CreditCardStatementRow.module.css";

export type StatementScheduleRow = {
  id: string;
  periodStart: string;
  closingDate: string;
  dueDate: string;
  computedTotalCents: number;
  plannedPaymentCents?: number;
  payAmountCents: number;
  status: StatementStatus;
  hasOverride: boolean;
};

export type CreditCardStatementRowData = {
  cardAccountId: string;
  cardName: string;
  payFromAccountName: string;
  lastDueDate?: string;
  nextDueDate?: string;
  nextPayAmountCents?: number;
  statements: StatementScheduleRow[];
};

type Props = {
  row: CreditCardStatementRowData;
  onEdit?: (statementId: string) => void;
  onMarkPaid?: (statementId: string) => void;
  onViewItems?: (statementId: string) => void;
};

function statusLabel(status: StatementStatus, hasOverride: boolean, payAmountCents: number, computedTotalCents: number): string {
  if (status === "paid") return "Paid";
  if (hasOverride && payAmountCents < computedTotalCents) return "Partial";
  if (status === "closed") return "Closed";
  return "Open";
}

export function CreditCardStatementRow({ row, onEdit, onMarkPaid, onViewItems }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={[styles.plan, expanded && styles.expanded].filter(Boolean).join(" ")}>
      <div className={styles.row}>
        <div className={styles.info}>
          <div className={styles.name}>{row.cardName}</div>
          <div className={styles.meta}>
            <Chip variant="statement">Statement</Chip>
          </div>
        </div>

        <div className={styles.payFrom}>
          <span className={styles.cellLabel} aria-hidden="true">
            Pay from
          </span>
          {row.payFromAccountName}
        </div>

        <div className={styles.horizon}>
          <span className={styles.cellLabel} aria-hidden="true">
            Horizon
          </span>
          {row.lastDueDate ? <FormattedDate isoDate={row.lastDueDate} /> : "—"}
        </div>

        <div className={[styles.next, !row.nextDueDate && styles.muted].filter(Boolean).join(" ")}>
          <span className={styles.cellLabel} aria-hidden="true">
            Next due
          </span>
          {row.nextDueDate ? (
            <>
              <span>
                <FormattedDate isoDate={row.nextDueDate} />
              </span>
              {row.nextPayAmountCents != null && (
                <span className={styles.nextAmount}>
                  − <MoneyAmount cents={row.nextPayAmountCents} />
                </span>
              )}
            </>
          ) : (
            "—"
          )}
        </div>

        <div className={styles.actions}>
          <IconButton
            title={expanded ? "Collapse statements" : "Expand statements"}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "▴" : "▾"}
          </IconButton>
        </div>
      </div>

      {expanded && (
        <div className={styles.schedule}>
          <div className={styles.scheduleHeader}>
            <span>Period</span>
            <span>Due</span>
            <span>Total</span>
            <span>Pay</span>
            <span>Status</span>
            <span />
          </div>
          {row.statements.map((stmt) => {
            const paid = stmt.status === "paid";
            return (
              <div
                key={stmt.id}
                className={[styles.scheduleRow, paid && styles.scheduleRowPaid]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className={styles.schedulePeriod}>
                  {formatStatementPeriod(stmt.periodStart, stmt.closingDate)}
                </span>
                <span className={styles.scheduleDue}>
                  <FormattedDate isoDate={stmt.dueDate} />
                </span>
                <span className={styles.scheduleTotal}>
                  <MoneyAmount cents={stmt.computedTotalCents} />
                </span>
                <span className={styles.schedulePay}>
                  <MoneyAmount cents={stmt.payAmountCents} />
                  {stmt.hasOverride && !paid && (
                    <Chip variant="statement">Override</Chip>
                  )}
                </span>
                <span className={styles.scheduleStatus}>
                  <Chip variant={paid ? "actual" : stmt.status === "open" ? "statement" : "default"}>
                    {statusLabel(
                      stmt.status,
                      stmt.hasOverride,
                      stmt.payAmountCents,
                      stmt.computedTotalCents,
                    )}
                  </Chip>
                </span>
                <span className={styles.scheduleActions}>
                  {onViewItems && (
                    <Button
                      variant="ghost"
                      className={styles.actionButton}
                      onClick={() => onViewItems(stmt.id)}
                    >
                      Items
                    </Button>
                  )}
                  {!paid && onEdit && (
                    <Button
                      variant="ghost"
                      className={styles.actionButton}
                      onClick={() => onEdit(stmt.id)}
                    >
                      Edit
                    </Button>
                  )}
                  {!paid && onMarkPaid && (
                    <Button
                      variant="ghost"
                      className={styles.actionButton}
                      onClick={() => onMarkPaid(stmt.id)}
                    >
                      Mark paid
                    </Button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
