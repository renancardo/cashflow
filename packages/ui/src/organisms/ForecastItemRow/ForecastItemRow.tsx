import type { TxType } from "@cashflow/core";
import { TX_TYPE_LABELS, txTypeChipVariant } from "@cashflow/core";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import styles from "./ForecastItemRow.module.css";

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
};

type Props = {
  row: ForecastItemRowData;
  dormant?: boolean;
  onActiveChange?: (id: string, isActive: boolean) => void;
  onEdit?: (id: string) => void;
};

export function ForecastItemRow({ row, dormant = false, onActiveChange, onEdit }: Props) {
  const amountTone =
    row.type === "income" ? "income" : row.type === "expense" ? "danger" : "default";
  const amountPrefix = row.type === "income" ? "+" : "−";
  const displayAmount = row.nextAmountCents ?? row.amountCents;
  const accountLabel = row.toAccountName
    ? `${row.accountName} → ${row.toAccountName}`
    : row.accountName;

  return (
    <article
      className={[styles.row, dormant && styles.dormant].filter(Boolean).join(" ")}
      data-type={row.type}
    >
      <div className={styles.info}>
        <div className={styles.name}>{row.description}</div>
        <div className={styles.meta}>
          <Chip variant={txTypeChipVariant(row.type)}>{TX_TYPE_LABELS[row.type]}</Chip>
          {row.categoryName && <Chip>{row.categoryName}</Chip>}
          {row.isSubscription && <Chip variant="subscription">Subscription</Chip>}
        </div>
      </div>

      <div className={styles.account}>{accountLabel}</div>
      <div className={styles.recurrence}>{row.recurrenceSummary}</div>

      <div className={[styles.next, !row.nextDate && styles.muted].filter(Boolean).join(" ")}>
        {row.nextDate ? <FormattedDate isoDate={row.nextDate} /> : "—"}
      </div>

      <div className={[styles.amount, styles[`amount${row.type}`]].filter(Boolean).join(" ")}>
        <span className={styles.amountPrefix} aria-hidden="true">
          {amountPrefix}
        </span>
        <MoneyAmount cents={displayAmount} tone={amountTone} />
      </div>

      <div className={styles.active}>
        <Toggle
          checked={row.isActive}
          aria-label={row.isActive ? "Active" : "Paused"}
          onChange={(checked) => onActiveChange?.(row.id, checked)}
        />
      </div>

      <div className={styles.actions}>
        <IconButton
          title="Edit forecast item"
          aria-label={`Edit ${row.description}`}
          onClick={() => onEdit?.(row.id)}
        >
          ✎
        </IconButton>
      </div>
    </article>
  );
}
