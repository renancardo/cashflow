import { useMemo, type ReactNode } from "react";
import { Button } from "../../atoms/Button/Button.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
import { SummaryStrip, SummaryStripItem } from "../../molecules/SummaryStrip/SummaryStrip.js";
import { useMessages } from "../../i18n/LanguageContext.js";
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
  const m = useMessages();
  const hasContent =
    recurring.length > 0 || oneOff.length > 0 || installments.length > 0 || statements.length > 0;
  if (!hasContent) return null;

  const h = m.forecast.headers;

  return (
    <section
      className={[styles.section, dormant && styles.sectionDormant].filter(Boolean).join(" ")}
    >
      <h2 className={styles.sectionTitle}>
        {title}
        {dormant && <span className={styles.sectionHint}>{m.forecast.excludedFromProjection}</span>}
      </h2>

      {recurring.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.groupLabel}>{m.forecast.groups.recurring}</h3>
          <div className={styles.list}>
            {plannedHeader && (
              <div className={styles.listHeader}>
                <span>{h.planned.item}</span>
                <span>{h.planned.account}</span>
                <span>{h.planned.recurrence}</span>
                <span>{h.planned.next}</span>
                <span>{h.planned.amount}</span>
                <span>{h.planned.active}</span>
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
          <h3 className={styles.groupLabel}>{m.forecast.groups.oneOff}</h3>
          <div className={styles.list}>
            {plannedHeader && recurring.length === 0 && (
              <div className={styles.listHeader}>
                <span>{h.planned.item}</span>
                <span>{h.planned.account}</span>
                <span>{h.planned.recurrence}</span>
                <span>{h.planned.next}</span>
                <span>{h.planned.amount}</span>
                <span>{h.planned.active}</span>
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
          <h3 className={styles.groupLabel}>{m.forecast.groups.installments}</h3>
          <div className={styles.list}>
            {installmentHeader && (
              <div className={styles.listHeaderInstallments}>
                <span>{h.installments.plan}</span>
                <span>{h.installments.account}</span>
                <span>{h.installments.progress}</span>
                <span>{h.installments.payoff}</span>
                <span>{h.installments.next}</span>
                <span>{h.installments.active}</span>
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
          <h3 className={styles.groupLabel}>{m.forecast.groups.creditCardStatements}</h3>
          <div className={styles.list}>
            {statementHeader && (
              <div className={styles.listHeaderStatements}>
                <span>{h.statements.card}</span>
                <span>{h.statements.payFrom}</span>
                <span>{h.statements.horizon}</span>
                <span>{h.statements.nextDue}</span>
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
  const m = useMessages();

  const filterOptions = useMemo(
    () => [
      { value: "all" as const, label: m.forecast.filters.all },
      { value: "subscription" as const, label: m.forecast.filters.subscriptions },
      { value: "income" as const, label: m.forecast.filters.income },
      { value: "expense" as const, label: m.forecast.filters.expense },
      { value: "transfer" as const, label: m.forecast.filters.transfer },
      { value: "installment" as const, label: m.forecast.filters.installments },
      { value: "statement" as const, label: m.forecast.filters.statements },
    ],
    [m],
  );

  if (status === "loading") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>{m.forecast.loading.title}</h2>
        <p>{m.forecast.loading.description}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>{m.forecast.error.title}</h2>
        <p>{errorMessage ?? m.common.errorFallback}</p>
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
          <Metric label={m.common.workingBalance}>
            <MoneyAmount cents={workingBalanceCents} />
          </Metric>
        }
        action={
          <div className={styles.headerActions}>
            <Button variant="ghost" onClick={onAddInstallmentPlan}>
              {m.forecast.addInstallmentPlan}
            </Button>
            <Button variant="primary" onClick={onAddForecastItem}>
              {m.forecast.addForecastItem}
            </Button>
          </div>
        }
      />

      <div className={styles.page}>
        <PageHeader title={m.forecast.title} subtitle={m.forecast.subtitle} />

        {isEmpty ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              📅
            </div>
            <h2 className={styles.emptyTitle}>{m.forecast.empty.title}</h2>
            <p className={styles.emptyDesc}>{m.forecast.empty.description}</p>
            <div className={styles.emptyActions}>
              <Button variant="primary" onClick={onAddForecastItem}>
                {m.forecast.addForecastItem}
              </Button>
              <Button variant="ghost" onClick={onAddInstallmentPlan}>
                {m.forecast.addInstallmentPlan}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <SummaryStrip className={styles.summary}>
              <SummaryStripItem label={m.forecast.summary.activeItems}>
                {summary.activeItemCount}
              </SummaryStripItem>
              <SummaryStripItem label={m.forecast.summary.subscriptions} tone="default">
                {summary.subscriptionCount}
              </SummaryStripItem>
              <SummaryStripItem label={m.forecast.summary.nextOutflow} tone="warning">
                {summary.nextOutflow ? (
                  <>
                    <FormattedDate isoDate={summary.nextOutflow.date} /> ·{" "}
                    <MoneyAmount cents={summary.nextOutflow.amountCents} />
                  </>
                ) : (
                  m.common.dash
                )}
              </SummaryStripItem>
              <SummaryStripItem label={m.forecast.summary.nextInflow} tone="success">
                {summary.nextInflow ? (
                  <>
                    <FormattedDate isoDate={summary.nextInflow.date} /> ·{" "}
                    <MoneyAmount cents={summary.nextInflow.amountCents} />
                  </>
                ) : (
                  m.common.dash
                )}
              </SummaryStripItem>
            </SummaryStrip>

            <div className={styles.filtersCard}>
              <div className={styles.filtersHeader}>
                <div className={styles.typeFilters}>
                  <SegmentedControl
                    aria-label={m.common.aria.filterByType}
                    value={filter}
                    onChange={(value) => onFilterChange?.(value)}
                    options={filterOptions}
                  />
                </div>
              </div>
            </div>

            <ForecastGroup
              title={m.forecast.sections.active}
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
              title={m.forecast.sections.dormant}
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
