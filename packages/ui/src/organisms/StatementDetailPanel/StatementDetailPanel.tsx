import type { StatementStatus } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip, type ChipVariant } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { formatStatementPeriod } from "../../lib/statementDates.js";
import styles from "./StatementDetailPanel.module.css";

export type StatementChargeRow = {
  id: string;
  source: "transaction" | "planned" | "installment" | "opening_debt";
  description: string;
  effectiveDate: string;
  amountCents: number;
  categoryName?: string;
  isProjected: boolean;
};

type Props = {
  open: boolean;
  cardName: string;
  periodStart: string;
  closingDate: string;
  dueDate: string;
  computedTotalCents: number;
  plannedPaymentCents?: number;
  status: StatementStatus;
  charges: StatementChargeRow[];
  loading?: boolean;
  onClose: () => void;
  onEdit?: () => void;
};

function sourceLabel(source: StatementChargeRow["source"]): string {
  switch (source) {
    case "opening_debt":
      return "Opening debt";
    case "transaction":
      return "Transaction";
    case "planned":
      return "Planned";
    case "installment":
      return "Installment";
  }
}

function sourceChipVariant(source: StatementChargeRow["source"]): ChipVariant {
  switch (source) {
    case "opening_debt":
      return "statement";
    case "transaction":
      return "actual";
    case "planned":
      return "planned";
    case "installment":
      return "installment";
  }
}

export function StatementDetailPanel({
  open,
  cardName,
  periodStart,
  closingDate,
  dueDate,
  computedTotalCents,
  plannedPaymentCents,
  status,
  charges,
  loading = false,
  onClose,
  onEdit,
}: Props) {
  if (!open) return null;

  const periodLabel =
    periodStart && closingDate
      ? formatStatementPeriod(periodStart, closingDate)
      : cardName;
  const payAmountCents = plannedPaymentCents ?? computedTotalCents;
  const isPaid = status === "paid";

  return (
    <div className={[styles.overlay, styles.open].join(" ")}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close statement items"
        onClick={onClose}
      />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="statement-detail-title"
      >
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h2 className={styles.title} id="statement-detail-title">
                Statement items
              </h2>
              <p className={styles.subtitle}>
                {cardName} · {periodLabel}
              </p>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Close statement items"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Due</span>
              {dueDate ? <FormattedDate isoDate={dueDate} /> : "—"}
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Computed total</span>
              <MoneyAmount cents={computedTotalCents} />
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Planned pay</span>
              <MoneyAmount cents={payAmountCents} />
            </div>
          </div>
        </header>

        <div className={styles.body}>
          {loading ? (
            <p className={styles.empty}>Loading items…</p>
          ) : charges.length === 0 ? (
            <p className={styles.empty}>No charges in this statement period yet.</p>
          ) : (
            <div className={styles.list}>
              <div className={styles.listHeader}>
                <span>Date</span>
                <span>Description</span>
                <span>Amount</span>
              </div>
              {charges.map((charge) => (
                <div
                  key={charge.id}
                  className={[styles.row, charge.isProjected && styles.rowProjected]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className={styles.date}>
                    <FormattedDate isoDate={charge.effectiveDate} />
                  </span>
                  <div className={styles.main}>
                    <div className={styles.description}>{charge.description}</div>
                    <div className={styles.meta}>
                      <Chip variant={sourceChipVariant(charge.source)}>
                        {sourceLabel(charge.source)}
                      </Chip>
                      {charge.categoryName && <span>{charge.categoryName}</span>}
                      {charge.isProjected && <Chip variant="planned">Projected</Chip>}
                    </div>
                  </div>
                  <span className={styles.amount}>
                    <MoneyAmount cents={charge.amountCents} tone="danger" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerTotal}>
            <span className={styles.summaryLabel}>Items total</span>
            <MoneyAmount cents={computedTotalCents} />
          </div>
          {!isPaid && onEdit && (
            <Button variant="ghost" onClick={onEdit}>
              Edit payment
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}
