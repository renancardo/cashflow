import type { ProjectionDay, ProjectionItem } from "@cashflow/core";
import { formatMoney } from "@cashflow/core";
import { Chip, type ChipVariant } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { formatWeekdayLong } from "../../lib/calendar.js";
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
  onQuickAddChange: (patch: Partial<QuickAddValues>) => void;
  onQuickAddSubmit: () => void;
  onClose: () => void;
};

function chipVariant(item: ProjectionItem): ChipVariant {
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

export function DayDetailPanel({
  open,
  day,
  quickAddValues,
  accountOptions,
  categoryOptions,
  currency = "BRL",
  saving = false,
  onQuickAddChange,
  onQuickAddSubmit,
  onClose,
}: Props) {
  const m = useMessages();
  const language = useLanguage();
  const locale = language === "pt-BR" ? "pt-BR" : "en-US";
  const transferError = validateQuickAddTransfer(quickAddValues, accountOptions);

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
                      {items.map((item) => (
                        <li key={`${item.source}-${item.refId}`}>
                          <article
                            className={[styles.item, item.isProjected && styles.itemProjected]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <div className={styles.itemMain}>
                              <div className={styles.itemDesc}>{item.description}</div>
                              <div className={styles.itemMeta}>
                                <Chip variant={chipVariant(item)}>
                                  {chipLabel(item, m.common.chips)}
                                </Chip>
                                <span>{itemMeta(item)}</span>
                              </div>
                            </div>
                            <span
                              className={[
                                styles.itemAmount,
                                styles[`amount-${amountTone(item)}`],
                              ].join(" ")}
                            >
                              {item.type === "income" ? "+ " : item.type === "expense" ? "− " : ""}
                              {formatMoney(item.amountCents)}
                            </span>
                          </article>
                        </li>
                      ))}
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
