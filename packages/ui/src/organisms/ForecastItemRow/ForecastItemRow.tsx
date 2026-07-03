import { useState } from "react";
import type { TxType } from "@cashflow/core";
import { TX_TYPE_LABELS, txTypeChipVariant } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import styles from "./ForecastItemRow.module.css";

export type ForecastOccurrenceRow = {
  occurrenceDate: string;
  effectiveDate: string;
  amountCents: number;
};

export type ForecastItemRowData = {
  id: string;
  type: TxType;
  amountCents: number;
  description: string;
  accountName: string;
  toAccountName?: string;
  categoryName?: string;
  recurrenceSummary: string;
  group: "recurring" | "oneOff";
  nextDate?: string;
  nextAmountCents?: number;
  isSubscription: boolean;
  isActive: boolean;
  occurrences: ForecastOccurrenceRow[];
};

type Props = {
  row: ForecastItemRowData;
  dormant?: boolean;
  onActiveChange?: (id: string, isActive: boolean) => void;
  onEdit?: (id: string) => void;
  onMarkPaid?: (plannedItemId: string, occurrenceDate: string) => void;
};

function markPaidLabel(type: TxType): string {
  return type === "income" ? "Mark as received" : "Mark paid";
}

function amountTone(type: TxType): "income" | "danger" | "default" {
  return type === "income" ? "income" : type === "expense" ? "danger" : "default";
}

export function ForecastItemRow({
  row,
  dormant = false,
  onActiveChange,
  onEdit,
  onMarkPaid,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasSchedule = row.occurrences.length > 0;
  const displayAmount = row.nextAmountCents ?? row.amountCents;
  const amountPrefix = row.type === "income" ? "+" : "−";
  const accountLabel = row.toAccountName
    ? `${row.accountName} → ${row.toAccountName}`
    : row.accountName;

  return (
    <article
      className={[styles.item, dormant && styles.dormant, expanded && styles.expanded]
        .filter(Boolean)
        .join(" ")}
      data-type={row.type}
    >
      <div className={styles.row}>
        <div className={styles.info}>
          <div className={styles.name}>{row.description}</div>
          <div className={styles.meta}>
            <Chip variant={txTypeChipVariant(row.type)}>{TX_TYPE_LABELS[row.type]}</Chip>
            {row.categoryName && <Chip>{row.categoryName}</Chip>}
            {row.isSubscription && <Chip variant="subscription">Subscription</Chip>}
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.account}>{accountLabel}</div>
          <div className={styles.recurrence}>{row.recurrenceSummary}</div>
          <div className={[styles.next, !row.nextDate && styles.muted].filter(Boolean).join(" ")}>
            {row.nextDate ? <FormattedDate isoDate={row.nextDate} /> : "—"}
          </div>
        </div>

        <div className={[styles.amount, styles[`amount${row.type}`]].filter(Boolean).join(" ")}>
          <span className={styles.amountPrefix} aria-hidden="true">
            {amountPrefix}
          </span>
          <MoneyAmount cents={displayAmount} tone={amountTone(row.type)} />
        </div>

        <div className={styles.controls}>
          <div className={styles.active}>
            <Toggle
              checked={row.isActive}
              aria-label={row.isActive ? "Active" : "Paused"}
              onChange={(checked) => onActiveChange?.(row.id, checked)}
            />
            <span className={styles.activeLabel} aria-hidden="true">
              {row.isActive ? "Active" : "Paused"}
            </span>
          </div>

          <div className={styles.actions}>
            {hasSchedule && (
              <IconButton
                title={expanded ? "Collapse schedule" : "Expand schedule"}
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "▴" : "▾"}
              </IconButton>
            )}
            <IconButton
              title="Edit forecast item"
              aria-label={`Edit ${row.description}`}
              onClick={() => onEdit?.(row.id)}
            >
              ✎
            </IconButton>
          </div>
        </div>
      </div>

      {expanded && hasSchedule && (
        <div className={styles.schedule}>
          <div className={styles.scheduleHeader}>
            <span>Due</span>
            <span>Amount</span>
            <span />
          </div>
          {row.occurrences.map((occ) => (
            <div key={occ.occurrenceDate} className={styles.scheduleRow}>
              <span>
                <FormattedDate isoDate={occ.effectiveDate} />
              </span>
              <span>
                <MoneyAmount cents={occ.amountCents} tone={amountTone(row.type)} />
              </span>
              <span>
                {onMarkPaid && (
                  <Button
                    variant="ghost"
                    className={styles.markPaid}
                    onClick={() => onMarkPaid(row.id, occ.occurrenceDate)}
                  >
                    {markPaidLabel(row.type)}
                  </Button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
