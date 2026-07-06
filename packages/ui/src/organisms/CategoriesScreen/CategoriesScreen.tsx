import { useState, type ReactNode } from "react";
import type { CategoryKind } from "@cashflow/core";
import { fmt } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
import { SummaryStrip, SummaryStripItem } from "../../molecules/SummaryStrip/SummaryStrip.js";
import { formatMonthYear } from "../../lib/calendar.js";
import { useLanguage, useMessages } from "../../i18n/LanguageContext.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import { PageHeader } from "../PageHeader/PageHeader.js";
import styles from "./CategoriesScreen.module.css";

export type CategoryRowData = {
  id: string;
  name: string;
  kind: CategoryKind;
  color?: string;
  parentId?: string;
  budgetCents?: number;
  actualCents: number;
  children: CategoryRowData[];
};

type Props = {
  categories: CategoryRowData[];
  workingBalanceCents: number;
  selectedMonth: string;
  totalBudgetedCents: number;
  totalSpentCents: number;
  remainingCents: number;
  status?: "ready" | "loading" | "error";
  errorMessage?: string;
  editor?: ReactNode;
  onAddCategory?: () => void;
  onEditCategory?: (id: string) => void;
  onMonthChange?: (month: string) => void;
};

type KindFilter = "all" | "expense" | "income";

function ProgressBar({ actual, budget }: { actual: number; budget?: number }) {
  const m = useMessages();

  if (!budget || budget === 0) return <span className={styles.empty}>{m.common.dash}</span>;
  const pct = Math.min(actual / budget, 1);
  const over = actual > budget;
  return (
    <div className={styles.progressWrapper}>
      <div
        className={[styles.progressBar, over && styles.progressBarOver].filter(Boolean).join(" ")}
        style={{ "--progress": `${Math.round(pct * 100)}%` } as React.CSSProperties}
        role="progressbar"
        aria-valuenow={actual}
        aria-valuemin={0}
        aria-valuemax={budget}
      />
      <span
        className={[styles.progressLabel, over && styles.progressLabelOver]
          .filter(Boolean)
          .join(" ")}
      >
        {Math.round(pct * 100)}%{over ? m.categories.over : ""}
      </span>
    </div>
  );
}

function BudgetRow({
  row,
  depth = 0,
  onEdit,
}: {
  row: CategoryRowData;
  depth?: number;
  onEdit?: (id: string) => void;
}) {
  const m = useMessages();
  const variance = row.budgetCents !== undefined ? row.budgetCents - row.actualCents : undefined;
  const over = variance !== undefined && variance < 0;
  const under = variance !== undefined && variance >= 0;
  const hasChildren = row.children.length > 0;

  return (
    <>
      <article
        className={[styles.row, depth > 0 && styles.rowChild, hasChildren && styles.rowParent]
          .filter(Boolean)
          .join(" ")}
        data-id={row.id}
      >
        <div className={styles.rowInfo}>
          {row.color && (
            <span className={styles.rowDot} style={{ background: row.color }} aria-hidden="true" />
          )}
          <div>
            <div className={styles.rowName}>{row.name}</div>
            {hasChildren && (
              <div className={styles.rowMeta}>
                {fmt(m.categories.subcategories, { count: row.children.length })}
              </div>
            )}
          </div>
        </div>

        <div className={[styles.cell, !row.budgetCents && styles.empty].filter(Boolean).join(" ")}>
          {row.budgetCents ? <MoneyAmount cents={row.budgetCents} /> : m.common.dash}
        </div>

        <div className={styles.cell}>
          <MoneyAmount cents={row.actualCents} />
        </div>

        <div
          className={[
            styles.cell,
            styles.variance,
            over && styles.varianceOver,
            under && styles.varianceUnder,
            variance === undefined && styles.empty,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {variance === undefined ? (
            m.common.dash
          ) : over ? (
            <>
              −&nbsp;
              <MoneyAmount cents={Math.abs(variance)} />
            </>
          ) : (
            <>
              +&nbsp;
              <MoneyAmount cents={variance} />
            </>
          )}
        </div>

        <div className={styles.cell}>
          <ProgressBar actual={row.actualCents} budget={row.budgetCents} />
        </div>

        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.editBtn}
            title={m.categories.editor.editCategory}
            aria-label={fmt(m.common.aria.editName, { name: row.name })}
            onClick={() => onEdit?.(row.id)}
          >
            ✎
          </button>
        </div>
      </article>

      {hasChildren &&
        row.children.map((child) => (
          <BudgetRow key={child.id} row={child} depth={1} onEdit={onEdit} />
        ))}
    </>
  );
}

function IncomeRow({ row, onEdit }: { row: CategoryRowData; onEdit?: (id: string) => void }) {
  const m = useMessages();

  return (
    <article className={[styles.row, styles.rowIncome].filter(Boolean).join(" ")} data-id={row.id}>
      <div className={styles.rowInfo}>
        {row.color && (
          <span className={styles.rowDot} style={{ background: row.color }} aria-hidden="true" />
        )}
        <div className={styles.rowName}>{row.name}</div>
      </div>

      <div
        className={[styles.cell, !row.actualCents && styles.cellMuted].filter(Boolean).join(" ")}
      >
        <MoneyAmount cents={row.actualCents} />
      </div>

      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.editBtn}
          title={m.categories.editor.editCategory}
          aria-label={fmt(m.common.aria.editName, { name: row.name })}
          onClick={() => onEdit?.(row.id)}
        >
          ✎
        </button>
      </div>
    </article>
  );
}

export function CategoriesScreen({
  categories,
  workingBalanceCents,
  selectedMonth,
  totalBudgetedCents,
  totalSpentCents,
  remainingCents,
  status = "ready",
  errorMessage,
  editor,
  onAddCategory,
  onEditCategory,
  onMonthChange,
}: Props) {
  const m = useMessages();
  const language = useLanguage();
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const monthLocale = language === "pt-BR" ? "pt-BR" : "en-US";

  if (status === "loading") {
    return (
      <div className={styles.statusPage}>
        <h2 className={styles.statusTitle}>{m.categories.loading.title}</h2>
        <p>{m.categories.loading.description}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.statusPage}>
        <h2 className={styles.statusTitle}>{m.categories.error.title}</h2>
        <p>{errorMessage ?? m.common.errorFallback}</p>
      </div>
    );
  }

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");
  const isEmpty = categories.length === 0;

  const showExpense = kindFilter === "all" || kindFilter === "expense";
  const showIncome = kindFilter === "all" || kindFilter === "income";

  const monthLabel = formatMonthYear(selectedMonth, monthLocale);

  const budgetUsedPct =
    totalBudgetedCents > 0
      ? Math.min(Math.round((totalSpentCents / totalBudgetedCents) * 100), 100)
      : 0;
  const budgetOver = totalSpentCents > totalBudgetedCents && totalBudgetedCents > 0;

  const expenseCategorySuffix =
    expenseCategories.length === 1
      ? m.categories.summary.expenseCategory
      : m.categories.summary.expenseCategories;

  return (
    <>
      <HeaderStrip
        metric={
          <Metric label={m.common.workingBalance}>
            <MoneyAmount cents={workingBalanceCents} />
          </Metric>
        }
        action={
          <Button variant="primary" onClick={onAddCategory}>
            {m.categories.addCategory}
          </Button>
        }
      />

      <div className={styles.page}>
        <PageHeader title={m.categories.title} subtitle={m.categories.subtitle} />

        {isEmpty ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏷</div>
            <h2 className={styles.emptyTitle}>{m.categories.empty.title}</h2>
            <p className={styles.emptyDesc}>{m.categories.empty.description}</p>
            <Button variant="primary" onClick={onAddCategory}>
              {m.categories.addCategory}
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.controlsCard}>
              <SummaryStrip className={styles.summary}>
                <SummaryStripItem
                  label={m.categories.summary.remaining}
                  className={styles.summaryHero}
                >
                  <span className={remainingCents < 0 ? styles.danger : styles.positive}>
                    {remainingCents < 0 ? "−\u00a0" : "+\u00a0"}
                    <MoneyAmount cents={Math.abs(remainingCents)} />
                  </span>
                </SummaryStripItem>
                <SummaryStripItem
                  label={m.categories.summary.budgeted}
                  className={styles.summaryMetric}
                >
                  <MoneyAmount cents={totalBudgetedCents} />
                </SummaryStripItem>
                <SummaryStripItem
                  label={m.categories.summary.spent}
                  className={styles.summaryMetric}
                >
                  <MoneyAmount
                    cents={totalSpentCents}
                    className={totalSpentCents > totalBudgetedCents ? styles.danger : undefined}
                  />
                </SummaryStripItem>
                <p className={styles.summaryMeta}>
                  {fmt(m.categories.summary.expenseCategoriesCount, {
                    count: expenseCategories.length,
                    suffix: expenseCategorySuffix,
                  })}
                </p>
                {totalBudgetedCents > 0 && (
                  <div
                    className={styles.budgetProgress}
                    role="progressbar"
                    aria-valuenow={totalSpentCents}
                    aria-valuemin={0}
                    aria-valuemax={totalBudgetedCents}
                    aria-label={fmt(m.categories.summary.budgetSpentPct, { pct: budgetUsedPct })}
                  >
                    <div
                      className={[
                        styles.budgetProgressBar,
                        budgetOver && styles.budgetProgressBarOver,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{ "--progress": `${budgetUsedPct}%` } as React.CSSProperties}
                    />
                  </div>
                )}
              </SummaryStrip>

              <div className={styles.toolbar} aria-label={m.common.aria.categoryViewControls}>
                <div className={styles.toolbarGroup}>
                  <label className={styles.toolbarLabel} htmlFor="filter-month">
                    {m.categories.toolbar.month}
                  </label>
                  <input
                    id="filter-month"
                    type="month"
                    className={styles.toolbarSelect}
                    value={selectedMonth}
                    aria-label={m.common.aria.filterByMonth}
                    onChange={(e) => onMonthChange?.(e.target.value)}
                  />
                </div>

                <SegmentedControl
                  className={styles.toolbarFilters}
                  aria-label={m.common.aria.filterByKind}
                  value={kindFilter}
                  onChange={setKindFilter}
                  options={[
                    { value: "all", label: m.categories.filters.all },
                    { value: "expense", label: m.categories.filters.expense },
                    { value: "income", label: m.categories.filters.income },
                  ]}
                />
              </div>
            </div>

            {showExpense && expenseCategories.length > 0 && (
              <section className={styles.section} aria-label={m.common.aria.expenseCategories}>
                <h2 className={styles.sectionTitle}>{m.categories.sections.expenseBudgets}</h2>

                <div className={styles.budgetList}>
                  <div className={styles.listHeader}>
                    <span>{m.categories.headers.category}</span>
                    <span>{m.categories.headers.budget}</span>
                    <span>{fmt(m.categories.headers.actualWithMonth, { month: monthLabel })}</span>
                    <span>{m.categories.headers.variance}</span>
                    <span>{m.categories.headers.progress}</span>
                    <span />
                  </div>
                  {expenseCategories.map((row) => (
                    <BudgetRow key={row.id} row={row} onEdit={onEditCategory} />
                  ))}
                </div>
              </section>
            )}

            {showIncome && incomeCategories.length > 0 && (
              <section className={styles.section} aria-label={m.common.aria.incomeCategories}>
                <h2 className={styles.sectionTitle}>{m.categories.sections.incomeCategories}</h2>

                <div className={styles.incomeList}>
                  <div className={[styles.listHeader, styles.listHeaderIncome].join(" ")}>
                    <span>{m.categories.headers.category}</span>
                    <span>{fmt(m.categories.headers.actualWithMonth, { month: monthLabel })}</span>
                    <span />
                  </div>
                  {incomeCategories.map((row) => (
                    <IncomeRow key={row.id} row={row} onEdit={onEditCategory} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {editor}
    </>
  );
}
