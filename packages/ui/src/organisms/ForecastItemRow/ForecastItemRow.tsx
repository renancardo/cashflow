import { useState } from "react";
import type { TxType } from "@cashflow/core";
import { fmt, txTypeChipVariant, txTypeLabel } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import styles from "./ForecastItemRow.module.css";

export type ForecastOccurrenceRow = {
  occurrenceDate: string;
  effectiveDate: string;
  amountCents: number;
  isSettled?: boolean;
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
  const m = useMessages();
  const [expanded, setExpanded] = useState(false);
  const hasSchedule = row.occurrences.length > 0;
  const displayAmount = row.nextAmountCents ?? row.amountCents;
  const amountPrefix = row.type === "income" ? "+" : "−";
  const accountLabel = row.toAccountName
    ? `${row.accountName} → ${row.toAccountName}`
    : row.accountName;
  const markPaidLabel = row.type === "income" ? m.common.markAsReceived : m.common.markPaid;

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
            <Chip variant={txTypeChipVariant(row.type)}>{txTypeLabel(m, row.type)}</Chip>
            {row.categoryName && <Chip>{row.categoryName}</Chip>}
            {row.isSubscription && (
              <Chip variant="subscription">{m.common.chips.subscription}</Chip>
            )}
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.account}>{accountLabel}</div>
          <div className={styles.recurrence}>{row.recurrenceSummary}</div>
          <div className={[styles.next, !row.nextDate && styles.muted].filter(Boolean).join(" ")}>
            {row.nextDate ? <FormattedDate isoDate={row.nextDate} /> : m.common.dash}
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
              aria-label={row.isActive ? m.common.active : m.common.paused}
              onChange={(checked) => onActiveChange?.(row.id, checked)}
            />
            <span className={styles.activeLabel} aria-hidden="true">
              {row.isActive ? m.common.active : m.common.paused}
            </span>
          </div>

          <div className={styles.actions}>
            {hasSchedule && (
              <IconButton
                title={
                  expanded ? m.forecast.editor.collapseSchedule : m.forecast.editor.expandSchedule
                }
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "▴" : "▾"}
              </IconButton>
            )}
            <IconButton
              title={m.forecast.editor.editForecastItemAction}
              aria-label={fmt(m.common.aria.editDescription, { description: row.description })}
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
            <span>{m.forecast.headers.schedule.due}</span>
            <span>{m.forecast.headers.schedule.amount}</span>
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
                {occ.isSettled ? (
                  <Chip variant="actual">{m.common.paid}</Chip>
                ) : (
                  onMarkPaid && (
                    <Button
                      variant="ghost"
                      className={styles.markPaid}
                      onClick={() => onMarkPaid(row.id, occ.occurrenceDate)}
                    >
                      {markPaidLabel}
                    </Button>
                  )
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
