import { useState } from "react";
import type { ProjectionDay, ProjectionItem } from "@cashflow/core";
import { fmt, formatMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip, type ChipVariant } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { formatWeekdayLong } from "../../lib/calendar.js";
import { InlineEditableAmount } from "../../molecules/InlineEditableAmount/InlineEditableAmount.js";
import { InlineEditableText } from "../../molecules/InlineEditableText/InlineEditableText.js";
import {
  QuickAddCard,
  type QuickAddValues,
  validateQuickAddTransfer,
} from "../../molecules/QuickAddCard/QuickAddCard.js";
import { useLanguage, useMessages } from "../../i18n/LanguageContext.js";
import styles from "./DayDetailPanel.module.css";

export type DayDetailItem = ProjectionItem & {
  accountName: string;
  categoryName?: string;
  toAccountName?: string;
};

export type DayDetailSettleRequest =
  | { source: "planned"; plannedItemId: string; occurrenceDate: string }
  | { source: "installment"; installmentId: string }
  | { source: "statement_payment"; statementId: string };

export type DayDetailAmountUpdateRequest = {
  itemKey: string;
} & (
  | { source: "transaction"; transactionId: string; amountCents: number }
  | { source: "planned"; plannedItemId: string; occurrenceDate: string; amountCents: number }
  | { source: "installment"; installmentId: string; amountCents: number }
  | { source: "statement_payment"; statementId: string; amountCents: number }
);

export type DayDetailDescriptionUpdateRequest = {
  itemKey: string;
} & (
  | { source: "transaction"; transactionId: string; description: string }
  | { source: "planned"; plannedItemId: string; description: string }
  | { source: "installment"; installmentId: string; description: string }
);

type AccountOption = { id: string; name: string; type: import("@cashflow/core").AccountType };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };

type Props = {
  open: boolean;
  day: ProjectionDay | null;
  quickAddValues: QuickAddValues;
  accountOptions: AccountOption[];
  categoryOptions: CategoryOption[];
  currency?: string;
  saving?: boolean;
  settlingKey?: string | null;
  updatingKey?: string | null;
  onQuickAddChange: (patch: Partial<QuickAddValues>) => void;
  onQuickAddSubmit: () => void;
  onSettle?: (request: DayDetailSettleRequest) => void;
  onUpdateAmount?: (request: DayDetailAmountUpdateRequest) => void;
  onUpdateDescription?: (request: DayDetailDescriptionUpdateRequest) => void;
  onClose: () => void;
};

function chipVariant(item: ProjectionItem): ChipVariant {
  if (item.isOverdue) return item.type === "income" ? "income" : "expense";
  if (!item.isProjected) return "actual";
  if (item.source === "statement_payment") return "statement";
  if (item.source === "installment") return "installment";
  if (item.source === "planned") return "planned";
  return "planned";
}

function chipLabel(
  item: ProjectionItem,
  chips: ReturnType<typeof useMessages>["common"]["chips"],
): string {
  if (item.isOverdue) return item.type === "income" ? chips.awaiting : chips.pastDue;
  if (!item.isProjected) return chips.actual;
  if (item.source === "statement_payment") return chips.statement;
  if (item.source === "installment") return chips.installment;
  return chips.planned;
}

function itemMeta(item: DayDetailItem): string {
  if (item.type === "transfer" && item.toAccountName) {
    return `${item.accountName} → ${item.toAccountName}`;
  }
  if (item.categoryName) return `${item.categoryName} · ${item.accountName}`;
  return item.accountName;
}

function amountTone(item: ProjectionItem): "income" | "danger" | "default" {
  if (item.type === "income") return "income";
  if (item.type === "expense") return "danger";
  return "default";
}

function amountSign(item: ProjectionItem): "+" | "−" | "" {
  if (item.type === "income") return "+";
  if (item.type === "expense") return "−";
  return "";
}

function buildSettleRequest(item: ProjectionItem, dayDate: string): DayDetailSettleRequest | null {
  if (!item.isProjected) return null;

  switch (item.source) {
    case "planned":
      return {
        source: "planned",
        plannedItemId: item.refId,
        occurrenceDate: item.occurrenceDate ?? dayDate,
      };
    case "installment":
      return { source: "installment", installmentId: item.refId };
    case "statement_payment":
      return { source: "statement_payment", statementId: item.refId };
    default:
      return null;
  }
}

export function dayDetailItemKey(item: ProjectionItem, dayDate: string): string {
  return `${item.source}-${item.refId}-${item.occurrenceDate ?? dayDate}`;
}

export function dayDetailSettleKeyFromRequest(request: DayDetailSettleRequest): string {
  if (request.source === "planned") {
    return `planned-${request.plannedItemId}-${request.occurrenceDate}`;
  }
  if (request.source === "installment") {
    return `installment-${request.installmentId}`;
  }
  return `statement_payment-${request.statementId}`;
}

export function dayDetailSettleKey(item: ProjectionItem, dayDate: string): string {
  const request = buildSettleRequest(item, dayDate);
  if (!request) return `${item.source}-${item.refId}`;
  return dayDetailSettleKeyFromRequest(request);
}

function buildAmountUpdateRequest(
  item: ProjectionItem,
  dayDate: string,
  amountCents: number,
): DayDetailAmountUpdateRequest | null {
  const itemKey = dayDetailItemKey(item, dayDate);

  switch (item.source) {
    case "transaction":
      return { itemKey, source: "transaction", transactionId: item.refId, amountCents };
    case "planned":
      return {
        itemKey,
        source: "planned",
        plannedItemId: item.refId,
        occurrenceDate: item.occurrenceDate ?? dayDate,
        amountCents,
      };
    case "installment":
      return { itemKey, source: "installment", installmentId: item.refId, amountCents };
    case "statement_payment":
      return { itemKey, source: "statement_payment", statementId: item.refId, amountCents };
    default:
      return null;
  }
}

function buildDescriptionUpdateRequest(
  item: ProjectionItem,
  dayDate: string,
  description: string,
): DayDetailDescriptionUpdateRequest | null {
  const itemKey = dayDetailItemKey(item, dayDate);

  switch (item.source) {
    case "transaction":
      return { itemKey, source: "transaction", transactionId: item.refId, description };
    case "planned":
      return { itemKey, source: "planned", plannedItemId: item.refId, description };
    case "installment":
      return { itemKey, source: "installment", installmentId: item.refId, description };
    default:
      return null;
  }
}

function isDescriptionEditable(item: ProjectionItem): boolean {
  return item.source === "transaction" || item.source === "planned" || item.source === "installment";
}

function settleLabel(
  item: ProjectionItem,
  labels: { markPaid: string; markAsReceived: string; confirmPayment: string },
): string {
  if (item.source === "statement_payment") return labels.confirmPayment;
  if (item.type === "income") return labels.markAsReceived;
  return labels.markPaid;
}

export function DayDetailPanel({
  open,
  day,
  quickAddValues,
  accountOptions,
  categoryOptions,
  currency = "BRL",
  saving = false,
  settlingKey = null,
  updatingKey = null,
  onQuickAddChange,
  onQuickAddSubmit,
  onSettle,
  onUpdateAmount,
  onUpdateDescription,
  onClose,
}: Props) {
  const m = useMessages();
  const language = useLanguage();
  const locale = language === "pt-BR" ? "pt-BR" : "en-US";
  const transferError = validateQuickAddTransfer(quickAddValues, accountOptions);
  const [activeEditKey, setActiveEditKey] = useState<string | null>(null);

  const groups: { title: string; sources: ProjectionItem["source"][] }[] = [
    { title: m.dayDetail.groups.transactions, sources: ["transaction"] },
    { title: m.dayDetail.groups.planned, sources: ["planned"] },
    { title: m.dayDetail.groups.installments, sources: ["installment"] },
    { title: m.dayDetail.groups.statementPayments, sources: ["statement_payment"] },
  ];

  return (
    <div
      className={[styles.overlay, open && styles.open].filter(Boolean).join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label={m.common.aria.closeDayDetail}
        onClick={onClose}
      />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-detail-title"
      >
        {day && (
          <>
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div>
                  <h2 className={styles.title} id="day-detail-title">
                    <FormattedDate isoDate={day.date} />
                  </h2>
                  <p className={styles.subtitle}>{formatWeekdayLong(day.date, locale)}</p>
                </div>
                <button
                  type="button"
                  className={styles.close}
                  aria-label={m.common.aria.closeDayDetail}
                  onClick={onClose}
                >
                  ×
                </button>
              </div>

              <div className={styles.balances}>
                <div className={styles.balance}>
                  <span className={styles.balanceLabel}>{m.dayDetail.opening}</span>
                  <MoneyAmount cents={day.openingBalanceCents} className={styles.balanceValue} />
                </div>
                <div className={styles.balance}>
                  <span className={styles.balanceLabel}>{m.dayDetail.closing}</span>
                  <MoneyAmount
                    cents={day.closingBalanceCents}
                    tone={day.belowBuffer ? "danger" : "default"}
                    className={styles.balanceValue}
                  />
                </div>
              </div>

              {day.belowBuffer && (
                <div className={styles.flag} role="status">
                  <span className={styles.flagDot} aria-hidden />
                  {m.dayDetail.belowBuffer}
                </div>
              )}
            </header>

            <div className={styles.body}>
              {groups.map((group) => {
                const items = day.items.filter((item) =>
                  group.sources.includes(item.source),
                ) as DayDetailItem[];
                if (items.length === 0) return null;

                return (
                  <section key={group.title} className={styles.group}>
                    <h3 className={styles.groupTitle}>{group.title}</h3>
                    <ul className={styles.list}>
                      {items.map((item) => {
                        const settleRequest = buildSettleRequest(item, day.date);
                        const itemKey = dayDetailItemKey(item, day.date);
                        const itemSettleKey = dayDetailSettleKey(item, day.date);
                        const isSettlingItem = settlingKey === itemSettleKey;
                        const isUpdatingItem = updatingKey === itemKey;
                        const amountRequest = buildAmountUpdateRequest(
                          item,
                          day.date,
                          item.amountCents,
                        );

                        return (
                          <li key={itemKey}>
                            <article
                              className={[styles.item, item.isProjected && styles.itemProjected]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <div className={styles.itemMain}>
                                {isDescriptionEditable(item) && onUpdateDescription ? (
                                  <InlineEditableText
                                    value={item.description}
                                    className={styles.itemDesc}
                                    ariaLabel={fmt(m.common.aria.editDescription, {
                                      description: item.description,
                                    })}
                                    disabled={isUpdatingItem || isSettlingItem}
                                    editKey={`${itemKey}-description`}
                                    activeEditKey={activeEditKey}
                                    onActiveEditKeyChange={setActiveEditKey}
                                    onSave={(description) => {
                                      const request = buildDescriptionUpdateRequest(
                                        item,
                                        day.date,
                                        description,
                                      );
                                      if (request) onUpdateDescription(request);
                                    }}
                                  />
                                ) : (
                                  <div className={styles.itemDesc}>{item.description}</div>
                                )}
                                <div className={styles.itemMeta}>
                                  <Chip variant={chipVariant(item)}>
                                    {chipLabel(item, m.common.chips)}
                                  </Chip>
                                  <span>{itemMeta(item)}</span>
                                </div>
                              </div>
                              {onUpdateAmount && amountRequest ? (
                                <InlineEditableAmount
                                  cents={item.amountCents}
                                  tone={amountTone(item)}
                                  sign={amountSign(item)}
                                  className={styles.itemAmount}
                                  ariaLabel={fmt(m.dayDetail.editAmount, {
                                    description: item.description,
                                  })}
                                  disabled={isUpdatingItem || isSettlingItem}
                                  editKey={`${itemKey}-amount`}
                                  activeEditKey={activeEditKey}
                                  onActiveEditKeyChange={setActiveEditKey}
                                  onSave={(amountCents) => {
                                    const request = buildAmountUpdateRequest(
                                      item,
                                      day.date,
                                      amountCents,
                                    );
                                    if (request) onUpdateAmount(request);
                                  }}
                                />
                              ) : (
                                <span
                                  className={[
                                    styles.itemAmount,
                                    styles[`amount-${amountTone(item)}`],
                                  ].join(" ")}
                                >
                                  {amountSign(item) ? `${amountSign(item)} ` : ""}
                                  {formatMoney(item.amountCents)}
                                </span>
                              )}
                              {settleRequest && onSettle && (
                                <Button
                                  variant="primary"
                                  className={styles.confirmButton}
                                  disabled={isSettlingItem || isUpdatingItem}
                                  onClick={() => onSettle(settleRequest)}
                                >
                                  {isSettlingItem
                                    ? m.dayDetail.settling
                                    : settleLabel(item, {
                                        markPaid: m.common.markPaid,
                                        markAsReceived: m.common.markAsReceived,
                                        confirmPayment: m.dayDetail.confirmPayment,
                                      })}
                                </Button>
                              )}
                            </article>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}

              {day.items.length === 0 && <p className={styles.empty}>{m.dayDetail.empty}</p>}
            </div>

            <footer className={styles.footer}>
              <QuickAddCard
                values={quickAddValues}
                currency={currency}
                accountOptions={accountOptions}
                categoryOptions={categoryOptions}
                transferError={transferError}
                saving={saving}
                onChange={onQuickAddChange}
                onSubmit={onQuickAddSubmit}
              />
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
