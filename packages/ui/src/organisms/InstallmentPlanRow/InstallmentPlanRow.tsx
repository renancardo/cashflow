import { useState, type CSSProperties } from "react";
import { fmt } from "@cashflow/core";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { Button } from "../../atoms/Button/Button.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import styles from "./InstallmentPlanRow.module.css";

export type InstallmentScheduleRow = {
  id: string;
  index: number;
  dueDate: string;
  amountCents: number;
  status: "scheduled" | "paid";
};

export type InstallmentPlanRowData = {
  id: string;
  description: string;
  accountName: string;
  categoryName?: string;
  paidCount: number;
  totalCount: number;
  progressPercent: number;
  payoffDate: string;
  nextDueDate?: string;
  nextDueAmountCents?: number;
  isActive: boolean;
  installments: InstallmentScheduleRow[];
};

type Props = {
  row: InstallmentPlanRowData;
  dormant?: boolean;
  onActiveChange?: (id: string, isActive: boolean) => void;
  onEdit?: (id: string) => void;
  onMarkPaid?: (installmentId: string) => void;
};

export function InstallmentPlanRow({
  row,
  dormant = false,
  onActiveChange,
  onEdit,
  onMarkPaid,
}: Props) {
  const m = useMessages();
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={[styles.plan, dormant && styles.dormant, expanded && styles.expanded]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.row}>
        <div className={styles.info}>
          <div className={styles.name}>{row.description}</div>
          <div className={styles.meta}>
            <Chip variant="expense">{m.common.kind.expense}</Chip>
            {row.categoryName && <Chip>{row.categoryName}</Chip>}
          </div>
        </div>

        <div className={styles.account}>{row.accountName}</div>

        <div className={styles.progress}>
          <span
            className={styles.progressBar}
            style={{ "--progress": `${row.progressPercent}%` } as CSSProperties}
            role="progressbar"
            aria-valuenow={row.paidCount}
            aria-valuemin={0}
            aria-valuemax={row.totalCount}
          />
          <span className={styles.progressText}>
            {fmt(m.forecast.editor.progressPaid, {
              paid: row.paidCount,
              total: row.totalCount,
            })}
          </span>
        </div>

        <div className={styles.payoff}>
          <span className={styles.cellLabel} aria-hidden="true">
            {m.common.form.payoff}
          </span>
          {row.isActive ? <FormattedDate isoDate={row.payoffDate} /> : m.common.dash}
        </div>

        <div className={[styles.next, !row.nextDueDate && styles.muted].filter(Boolean).join(" ")}>
          <span className={styles.cellLabel} aria-hidden="true">
            {m.common.form.next}
          </span>
          {row.nextDueDate ? (
            <>
              <span className={styles.nextDate}>
                <FormattedDate isoDate={row.nextDueDate} />
              </span>
              {row.nextDueAmountCents != null && (
                <span className={styles.nextAmount}>
                  − <MoneyAmount cents={row.nextDueAmountCents} />
                </span>
              )}
            </>
          ) : (
            m.common.dash
          )}
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
            <IconButton
              title={
                expanded ? m.forecast.editor.collapseSchedule : m.forecast.editor.expandSchedule
              }
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "▴" : "▾"}
            </IconButton>
            <IconButton
              title={m.forecast.editor.editInstallmentPlanAction}
              aria-label={fmt(m.common.aria.editDescription, { description: row.description })}
              onClick={() => onEdit?.(row.id)}
            >
              ✎
            </IconButton>
          </div>
        </div>
      </div>

      {expanded && (
        <div className={styles.schedule}>
          <div className={styles.scheduleHeader}>
            <span>{m.forecast.headers.schedule.number}</span>
            <span>{m.forecast.headers.schedule.due}</span>
            <span>{m.forecast.headers.schedule.amount}</span>
            <span>{m.forecast.headers.schedule.status}</span>
            <span />
          </div>
          {row.installments.map((inst) => (
            <div
              key={inst.id}
              className={[styles.scheduleRow, inst.status === "paid" && styles.scheduleRowPaid]
                .filter(Boolean)
                .join(" ")}
            >
              <span>{inst.index}</span>
              <span>
                <FormattedDate isoDate={inst.dueDate} />
              </span>
              <span>
                <MoneyAmount cents={inst.amountCents} />
              </span>
              <span>
                <Chip variant={inst.status === "paid" ? "income" : "default"}>
                  {inst.status === "paid" ? m.common.paid : m.common.scheduled}
                </Chip>
              </span>
              <span>
                {inst.status === "scheduled" && onMarkPaid && (
                  <Button
                    variant="ghost"
                    className={styles.markPaid}
                    onClick={() => onMarkPaid(inst.id)}
                  >
                    {m.common.markPaid}
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
