import { useState, type ReactNode } from "react";
import type { CategoryKind } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
import { SummaryStrip, SummaryStripItem } from "../../molecules/SummaryStrip/SummaryStrip.js";
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

// ─── Progress bar ────────────────────────────────────────────────────────────

function ProgressBar({ actual, budget }: { actual: number; budget?: number }) {
  if (!budget || budget === 0) return <span className={styles.empty}>—</span>;
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
        {Math.round(pct * 100)}%{over ? " · over" : ""}
      </span>
    </div>
  );
}

// ─── Budget row ───────────────────────────────────────────────────────────────

function BudgetRow({
  row,
  depth = 0,
  onEdit,
}: {
  row: CategoryRowData;
  depth?: number;
  onEdit?: (id: string) => void;
}) {
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
              <div className={styles.rowMeta}>{row.children.length} subcategories</div>
            )}
          </div>
        </div>

        <div className={[styles.cell, !row.budgetCents && styles.empty].filter(Boolean).join(" ")}>
          {row.budgetCents ? <MoneyAmount cents={row.budgetCents} /> : "—"}
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
            "—"
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
            title="Edit category"
            aria-label={`Edit ${row.name}`}
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

// ─── Income row ───────────────────────────────────────────────────────────────

function IncomeRow({ row, onEdit }: { row: CategoryRowData; onEdit?: (id: string) => void }) {
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
          title="Edit category"
          aria-label={`Edit ${row.name}`}
          onClick={() => onEdit?.(row.id)}
        >
          ✎
        </button>
      </div>
    </article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  if (status === "loading") {
    return (
      <div className={styles.statusPage}>
        <h2 className={styles.statusTitle}>Loading categories…</h2>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.statusPage}>
        <h2 className={styles.statusTitle}>Could not load categories</h2>
        <p>{errorMessage ?? "Something went wrong. Try again."}</p>
      </div>
    );
  }

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const incomeCategories = categories.filter((c) => c.kind === "income");
  const isEmpty = categories.length === 0;

  const showExpense = kindFilter === "all" || kindFilter === "expense";
  const showIncome = kindFilter === "all" || kindFilter === "income";

  const [filterY, filterM] = selectedMonth.split("-");
  const monthLabel = new Date(Number(filterY), Number(filterM) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const budgetUsedPct =
    totalBudgetedCents > 0
      ? Math.min(Math.round((totalSpentCents / totalBudgetedCents) * 100), 100)
      : 0;
  const budgetOver = totalSpentCents > totalBudgetedCents && totalBudgetedCents > 0;

  return (
    <>
      <HeaderStrip
        metric={
          <Metric label="Working balance">
            <MoneyAmount cents={workingBalanceCents} />
          </Metric>
        }
        action={
          <Button variant="primary" onClick={onAddCategory}>
            + Add category
          </Button>
        }
      />

      <div className={styles.page}>
        <PageHeader
          title="Categories & Budgets"
          subtitle="Manage income and expense categories, set monthly budgets, and track actual vs target"
        />

        {isEmpty ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏷</div>
            <h2 className={styles.emptyTitle}>No categories yet</h2>
            <p className={styles.emptyDesc}>
              Create your first income or expense category to classify transactions and set monthly
              spending targets.
            </p>
            <Button variant="primary" onClick={onAddCategory}>
              + Add category
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.controlsCard}>
              <SummaryStrip className={styles.summary}>
                <SummaryStripItem label="Remaining" className={styles.summaryHero}>
                  <span className={remainingCents < 0 ? styles.danger : styles.positive}>
                    {remainingCents < 0 ? "−\u00a0" : "+\u00a0"}
                    <MoneyAmount cents={Math.abs(remainingCents)} />
                  </span>
                </SummaryStripItem>
                <SummaryStripItem label="Budgeted" className={styles.summaryMetric}>
                  <MoneyAmount cents={totalBudgetedCents} />
                </SummaryStripItem>
                <SummaryStripItem label="Spent" className={styles.summaryMetric}>
                  <MoneyAmount
                    cents={totalSpentCents}
                    className={totalSpentCents > totalBudgetedCents ? styles.danger : undefined}
                  />
                </SummaryStripItem>
                <p className={styles.summaryMeta}>
                  {expenseCategories.length} expense{" "}
                  {expenseCategories.length === 1 ? "category" : "categories"}
                </p>
                {totalBudgetedCents > 0 && (
                  <div
                    className={styles.budgetProgress}
                    role="progressbar"
                    aria-valuenow={totalSpentCents}
                    aria-valuemin={0}
                    aria-valuemax={totalBudgetedCents}
                    aria-label={`${budgetUsedPct}% of budget spent`}
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

              <div className={styles.toolbar} aria-label="Category view controls">
                <div className={styles.toolbarGroup}>
                  <label className={styles.toolbarLabel} htmlFor="filter-month">
                    Month
                  </label>
                  <input
                    id="filter-month"
                    type="month"
                    className={styles.toolbarSelect}
                    value={selectedMonth}
                    aria-label="Filter by month"
                    onChange={(e) => onMonthChange?.(e.target.value)}
                  />
                </div>

                <SegmentedControl
                  className={styles.toolbarFilters}
                  aria-label="Filter by kind"
                  value={kindFilter}
                  onChange={setKindFilter}
                  options={[
                    { value: "all", label: "All" },
                    { value: "expense", label: "Expense" },
                    { value: "income", label: "Income" },
                  ]}
                />
              </div>
            </div>

            {/* Expense budget section */}
            {showExpense && expenseCategories.length > 0 && (
              <section className={styles.section} aria-label="Expense categories and budgets">
                <h2 className={styles.sectionTitle}>Expense budgets</h2>

                <div className={styles.budgetList}>
                  <div className={styles.listHeader}>
                    <span>Category</span>
                    <span>Budget</span>
                    <span>Actual ({monthLabel})</span>
                    <span>Variance</span>
                    <span>Progress</span>
                    <span />
                  </div>
                  {expenseCategories.map((row) => (
                    <BudgetRow key={row.id} row={row} onEdit={onEditCategory} />
                  ))}
                </div>
              </section>
            )}

            {/* Income section */}
            {showIncome && incomeCategories.length > 0 && (
              <section className={styles.section} aria-label="Income categories">
                <h2 className={styles.sectionTitle}>Income categories</h2>

                <div className={styles.incomeList}>
                  <div className={[styles.listHeader, styles.listHeaderIncome].join(" ")}>
                    <span>Category</span>
                    <span>Actual ({monthLabel})</span>
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
