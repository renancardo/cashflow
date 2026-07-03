import { useState, type CSSProperties } from "react";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { Button } from "../../atoms/Button/Button.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
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
            <Chip variant="expense">Expense</Chip>
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
            {row.paidCount} / {row.totalCount}
          </span>
        </div>

        <div className={styles.payoff}>
          {row.isActive ? <FormattedDate isoDate={row.payoffDate} /> : "—"}
        </div>

        <div className={[styles.next, !row.nextDueDate && styles.muted].filter(Boolean).join(" ")}>
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
            "—"
          )}
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
            title={expanded ? "Collapse schedule" : "Expand schedule"}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "▴" : "▾"}
          </IconButton>
          <IconButton
            title="Edit installment plan"
            aria-label={`Edit ${row.description}`}
            onClick={() => onEdit?.(row.id)}
          >
            ✎
          </IconButton>
        </div>
      </div>

      {expanded && (
        <div className={styles.schedule}>
          <div className={styles.scheduleHeader}>
            <span>#</span>
            <span>Due</span>
            <span>Amount</span>
            <span>Status</span>
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
                  {inst.status === "paid" ? "Paid" : "Scheduled"}
                </Chip>
              </span>
              <span>
                {inst.status === "scheduled" && onMarkPaid && (
                  <Button
                    variant="ghost"
                    className={styles.markPaid}
                    onClick={() => onMarkPaid(inst.id)}
                  >
                    Mark paid
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
