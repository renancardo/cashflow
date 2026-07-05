import type { StatementStatus } from "@cashflow/core";
import { fmt } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip, type ChipVariant } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { useMessages } from "../../i18n/LanguageContext.js";
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

function sourceLabel(
  m: ReturnType<typeof useMessages>,
  source: StatementChargeRow["source"],
): string {
  switch (source) {
    case "opening_debt":
      return m.common.chips.openingDebt;
    case "transaction":
      return m.common.chips.transaction;
    case "planned":
      return m.common.chips.planned;
    case "installment":
      return m.common.chips.installment;
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
  const m = useMessages();

  if (!open) return null;

  const periodLabel =
    periodStart && closingDate ? formatStatementPeriod(periodStart, closingDate) : cardName;
  const payAmountCents = plannedPaymentCents ?? computedTotalCents;
  const isPaid = status === "paid";

  return (
    <div className={[styles.overlay, styles.open].join(" ")}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label={m.common.aria.closeStatementItems}
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
                {m.statements.detail.title}
              </h2>
              <p className={styles.subtitle}>
                {fmt(m.statements.detail.subtitle, { cardName, period: periodLabel })}
              </p>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label={m.common.aria.closeStatementItems}
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{m.statements.due}</span>
              {dueDate ? <FormattedDate isoDate={dueDate} /> : m.common.dash}
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{m.statements.computedTotal}</span>
              <MoneyAmount cents={computedTotalCents} />
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{m.statements.plannedPay}</span>
              <MoneyAmount cents={payAmountCents} />
            </div>
          </div>
        </header>

        <div className={styles.body}>
          {loading ? (
            <p className={styles.empty}>{m.statements.loadingItems}</p>
          ) : charges.length === 0 ? (
            <p className={styles.empty}>{m.statements.emptyItems}</p>
          ) : (
            <div className={styles.list}>
              <div className={styles.listHeader}>
                <span>{m.statements.chargeHeaders.date}</span>
                <span>{m.statements.chargeHeaders.description}</span>
                <span>{m.statements.chargeHeaders.amount}</span>
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
                        {sourceLabel(m, charge.source)}
                      </Chip>
                      {charge.categoryName && <span>{charge.categoryName}</span>}
                      {charge.isProjected && (
                        <Chip variant="planned">{m.common.chips.projected}</Chip>
                      )}
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
            <span className={styles.summaryLabel}>{m.statements.itemsTotal}</span>
            <MoneyAmount cents={computedTotalCents} />
          </div>
          {!isPaid && onEdit && (
            <Button variant="ghost" onClick={onEdit}>
              {m.statements.editPayment}
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}
