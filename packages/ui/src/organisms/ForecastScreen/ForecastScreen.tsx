import type { ReactNode } from "react";
import { Button } from "../../atoms/Button/Button.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
import { SummaryStrip, SummaryStripItem } from "../../molecules/SummaryStrip/SummaryStrip.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import { PageHeader } from "../PageHeader/PageHeader.js";
import { ForecastItemRow, type ForecastItemRowData } from "../ForecastItemRow/ForecastItemRow.js";
import {
  InstallmentPlanRow,
  type InstallmentPlanRowData,
} from "../InstallmentPlanRow/InstallmentPlanRow.js";
import {
  CreditCardStatementRow,
  type CreditCardStatementRowData,
} from "../CreditCardStatementRow/CreditCardStatementRow.js";
import styles from "./ForecastScreen.module.css";

export type ForecastFilter =
  "all" | "subscription" | "income" | "expense" | "transfer" | "installment" | "statement";

export type ForecastSummary = {
  activeItemCount: number;
  subscriptionCount: number;
  nextOutflow: { date: string; amountCents: number } | null;
  nextInflow: { date: string; amountCents: number } | null;
};

const FILTER_OPTIONS: { value: ForecastFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "subscription", label: "Subscriptions" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
  { value: "installment", label: "Installments" },
  { value: "statement", label: "Statements" },
];

type Props = {
  plannedRows: ForecastItemRowData[];
  installmentRows: InstallmentPlanRowData[];
  statementRows: CreditCardStatementRowData[];
  allPlannedRows: ForecastItemRowData[];
  allInstallmentRows: InstallmentPlanRowData[];
  allStatementRows: CreditCardStatementRowData[];
  summary: ForecastSummary;
  filter: ForecastFilter;
  workingBalanceCents: number;
  status?: "ready" | "loading" | "error";
  errorMessage?: string;
  editor?: ReactNode;
  onFilterChange?: (filter: ForecastFilter) => void;
  onAddForecastItem?: () => void;
  onAddInstallmentPlan?: () => void;
  onPlannedActiveChange?: (id: string, isActive: boolean) => void;
  onInstallmentActiveChange?: (id: string, isActive: boolean) => void;
  onEditPlanned?: (id: string) => void;
  onEditInstallment?: (id: string) => void;
  onMarkInstallmentPaid?: (installmentId: string) => void;
  onMarkPlannedPaid?: (plannedItemId: string, occurrenceDate: string) => void;
  onEditStatement?: (statementId: string) => void;
  onMarkStatementPaid?: (statementId: string) => void;
  onViewStatementItems?: (statementId: string) => void;
};

function ForecastGroup({
  title,
  plannedHeader,
  installmentHeader,
  statementHeader,
  recurring,
  oneOff,
  installments,
  statements,
  dormant,
  onPlannedActiveChange,
  onInstallmentActiveChange,
  onEditPlanned,
  onEditInstallment,
  onMarkInstallmentPaid,
  onMarkPlannedPaid,
  onEditStatement,
  onMarkStatementPaid,
  onViewStatementItems,
}: {
  title: string;
  plannedHeader: boolean;
  installmentHeader: boolean;
  statementHeader: boolean;
  recurring: ForecastItemRowData[];
  oneOff: ForecastItemRowData[];
  installments: InstallmentPlanRowData[];
  statements: CreditCardStatementRowData[];
  dormant: boolean;
  onPlannedActiveChange?: (id: string, isActive: boolean) => void;
  onInstallmentActiveChange?: (id: string, isActive: boolean) => void;
  onEditPlanned?: (id: string) => void;
  onEditInstallment?: (id: string) => void;
  onMarkInstallmentPaid?: (installmentId: string) => void;
  onMarkPlannedPaid?: (plannedItemId: string, occurrenceDate: string) => void;
  onEditStatement?: (statementId: string) => void;
  onMarkStatementPaid?: (statementId: string) => void;
  onViewStatementItems?: (statementId: string) => void;
}) {
  const hasContent =
    recurring.length > 0 || oneOff.length > 0 || installments.length > 0 || statements.length > 0;
  if (!hasContent) return null;

  return (
    <section
      className={[styles.section, dormant && styles.sectionDormant].filter(Boolean).join(" ")}
    >
      <h2 className={styles.sectionTitle}>
        {title}
        {dormant && <span className={styles.sectionHint}>excluded from projection</span>}
      </h2>

      {recurring.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupLabel}>Recurring</h3>
          <div className={styles.list}>
            {plannedHeader && (
              <div className={styles.listHeader}>
                <span>Item</span>
                <span>Account</span>
                <span>Recurrence</span>
                <span>Next</span>
                <span>Amount</span>
                <span>Active</span>
                <span />
              </div>
            )}
            {recurring.map((row) => (
              <ForecastItemRow
                key={row.id}
                row={row}
                dormant={dormant}
                onActiveChange={onPlannedActiveChange}
                onEdit={onEditPlanned}
                onMarkPaid={onMarkPlannedPaid}
              />
            ))}
          </div>
        </div>
      )}

      {oneOff.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupLabel}>One-off</h3>
          <div className={styles.list}>
            {plannedHeader && recurring.length === 0 && (
              <div className={styles.listHeader}>
                <span>Item</span>
                <span>Account</span>
                <span>Recurrence</span>
                <span>Next</span>
                <span>Amount</span>
                <span>Active</span>
                <span />
              </div>
            )}
            {oneOff.map((row) => (
              <ForecastItemRow
                key={row.id}
                row={row}
                dormant={dormant}
                onActiveChange={onPlannedActiveChange}
                onEdit={onEditPlanned}
                onMarkPaid={onMarkPlannedPaid}
              />
            ))}
          </div>
        </div>
      )}

      {installments.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupLabel}>Installments</h3>
          <div className={styles.list}>
            {installmentHeader && (
              <div className={styles.listHeaderInstallments}>
                <span>Plan</span>
                <span>Account</span>
                <span>Progress</span>
                <span>Payoff</span>
                <span>Next</span>
                <span>Active</span>
                <span />
              </div>
            )}
            {installments.map((row) => (
              <InstallmentPlanRow
                key={row.id}
                row={row}
                dormant={dormant}
                onActiveChange={onInstallmentActiveChange}
                onEdit={onEditInstallment}
                onMarkPaid={onMarkInstallmentPaid}
              />
            ))}
          </div>
        </div>
      )}

      {statements.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupLabel}>Credit card statements</h3>
          <div className={styles.list}>
            {statementHeader && (
              <div className={styles.listHeaderStatements}>
                <span>Card</span>
                <span>Pay from</span>
                <span>Horizon</span>
                <span>Next due</span>
                <span />
              </div>
            )}
            {statements.map((row) => (
              <CreditCardStatementRow
                key={row.cardAccountId}
                row={row}
                onEdit={onEditStatement}
                onMarkPaid={onMarkStatementPaid}
                onViewItems={onViewStatementItems}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function ForecastScreen({
  plannedRows,
  installmentRows,
  statementRows,
  allPlannedRows,
  allInstallmentRows,
  allStatementRows,
  summary,
  filter,
  workingBalanceCents,
  status = "ready",
  errorMessage,
  editor,
  onFilterChange,
  onAddForecastItem,
  onAddInstallmentPlan,
  onPlannedActiveChange,
  onInstallmentActiveChange,
  onEditPlanned,
  onEditInstallment,
  onMarkInstallmentPaid,
  onMarkPlannedPaid,
  onEditStatement,
  onMarkStatementPaid,
  onViewStatementItems,
}: Props) {
  if (status === "loading") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>Loading forecast items…</h2>
        <p>Fetching planned income, expenses, and installment plans.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>Could not load forecast items</h2>
        <p>{errorMessage ?? "Something went wrong. Try again."}</p>
      </div>
    );
  }

  const isEmpty =
    allPlannedRows.length === 0 && allInstallmentRows.length === 0 && allStatementRows.length === 0;

  const activePlanned = plannedRows.filter((row) => row.isActive);
  const dormantPlanned = plannedRows.filter((row) => !row.isActive);
  const activeInstallments = installmentRows.filter((row) => row.isActive);
  const dormantInstallments = installmentRows.filter((row) => !row.isActive);

  const activePlannedGroups = {
    recurring: activePlanned.filter((row) => row.group === "recurring"),
    oneOff: activePlanned.filter((row) => row.group === "oneOff"),
  };
  const dormantPlannedGroups = {
    recurring: dormantPlanned.filter((row) => row.group === "recurring"),
    oneOff: dormantPlanned.filter((row) => row.group === "oneOff"),
  };

  return (
    <>
      <HeaderStrip
        metric={
          <Metric label="Working balance">
            <MoneyAmount cents={workingBalanceCents} />
          </Metric>
        }
        action={
          <div className={styles.headerActions}>
            <Button variant="ghost" onClick={onAddInstallmentPlan}>
              + Add installment plan
            </Button>
            <Button variant="primary" onClick={onAddForecastItem}>
              + Add forecast item
            </Button>
          </div>
        }
      />

      <div className={styles.page}>
        <PageHeader
          title="Forecast Items"
          subtitle="Recurring obligations, one-off plans, installment debt, card statements, and subscriptions"
        />

        {isEmpty ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              📅
            </div>
            <h2 className={styles.emptyTitle}>No forecast items yet</h2>
            <p className={styles.emptyDesc}>
              Add planned income, recurring bills, installment plans, or one-off transfers to see
              them on your calendar.
            </p>
            <div className={styles.emptyActions}>
              <Button variant="primary" onClick={onAddForecastItem}>
                + Add forecast item
              </Button>
              <Button variant="ghost" onClick={onAddInstallmentPlan}>
                + Add installment plan
              </Button>
            </div>
          </div>
        ) : (
          <>
            <SummaryStrip className={styles.summary}>
              <SummaryStripItem label="Active items">{summary.activeItemCount}</SummaryStripItem>
              <SummaryStripItem label="Subscriptions" tone="default">
                {summary.subscriptionCount}
              </SummaryStripItem>
              <SummaryStripItem label="Next outflow" tone="warning">
                {summary.nextOutflow ? (
                  <>
                    <FormattedDate isoDate={summary.nextOutflow.date} /> ·{" "}
                    <MoneyAmount cents={summary.nextOutflow.amountCents} />
                  </>
                ) : (
                  "—"
                )}
              </SummaryStripItem>
              <SummaryStripItem label="Next inflow" tone="success">
                {summary.nextInflow ? (
                  <>
                    <FormattedDate isoDate={summary.nextInflow.date} /> ·{" "}
                    <MoneyAmount cents={summary.nextInflow.amountCents} />
                  </>
                ) : (
                  "—"
                )}
              </SummaryStripItem>
            </SummaryStrip>

            <div className={styles.filtersCard}>
              <div className={styles.filtersHeader}>
                <div className={styles.typeFilters}>
                  <SegmentedControl
                    aria-label="Filter by type"
                    value={filter}
                    onChange={(value) => onFilterChange?.(value)}
                    options={FILTER_OPTIONS}
                  />
                </div>
              </div>
            </div>

            <ForecastGroup
              title="Active"
              plannedHeader
              installmentHeader
              statementHeader
              recurring={activePlannedGroups.recurring}
              oneOff={activePlannedGroups.oneOff}
              installments={activeInstallments}
              statements={statementRows}
              dormant={false}
              onPlannedActiveChange={onPlannedActiveChange}
              onInstallmentActiveChange={onInstallmentActiveChange}
              onEditPlanned={onEditPlanned}
              onEditInstallment={onEditInstallment}
              onMarkInstallmentPaid={onMarkInstallmentPaid}
              onMarkPlannedPaid={onMarkPlannedPaid}
              onEditStatement={onEditStatement}
              onMarkStatementPaid={onMarkStatementPaid}
              onViewStatementItems={onViewStatementItems}
            />

            <ForecastGroup
              title="Dormant"
              plannedHeader
              installmentHeader
              statementHeader
              recurring={dormantPlannedGroups.recurring}
              oneOff={dormantPlannedGroups.oneOff}
              installments={dormantInstallments}
              statements={[]}
              dormant
              onPlannedActiveChange={onPlannedActiveChange}
              onInstallmentActiveChange={onInstallmentActiveChange}
              onEditPlanned={onEditPlanned}
              onEditInstallment={onEditInstallment}
              onMarkInstallmentPaid={onMarkInstallmentPaid}
              onMarkPlannedPaid={onMarkPlannedPaid}
            />
          </>
        )}
      </div>

      {editor}
    </>
  );
}
