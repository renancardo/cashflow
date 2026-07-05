import { useState, type DragEvent, type ReactNode } from "react";
import type { TxType } from "@cashflow/core";
import { fmt, txTypeChipVariant, txTypeLabel } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import { PageHeader } from "../PageHeader/PageHeader.js";
import styles from "./TransactionsScreen.module.css";

export type TransactionSettlement = {
  kind: "planned" | "installment" | "statement";
  label: string;
};

export type TransactionRowData = {
  id: string;
  type: TxType;
  amountCents: number;
  description: string;
  effectiveDate: string;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  categoryId?: string;
  categoryName?: string;
  settlement?: TransactionSettlement;
};

export type TransactionFiltersState = {
  type?: TxType;
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type Option = { id: string; name: string };

type ReorderPosition = "before" | "after";

type DropTarget = {
  id: string;
  position: ReorderPosition;
};

type Props = {
  transactions: TransactionRowData[];
  totalCount: number;
  hasMore: boolean;
  accountOptions: Option[];
  categoryOptions: Option[];
  filters: TransactionFiltersState;
  workingBalanceCents: number;
  status?: "ready" | "loading" | "error";
  errorMessage?: string;
  editor?: ReactNode;
  onFiltersChange?: (filters: TransactionFiltersState) => void;
  onLoadMore?: () => void;
  onAddTransaction?: () => void;
  onEdit?: (id: string) => void;
  onReorder?: (draggedId: string, targetId: string, position: ReorderPosition) => void;
};

type TypeFilter = "all" | TxType;

function countActiveFilters(filters: TransactionFiltersState): number {
  let count = 0;
  if (filters.type) count += 1;
  if (filters.accountId) count += 1;
  if (filters.categoryId) count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}

function TransactionRow({
  row,
  draggingId,
  dropTarget,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  row: TransactionRowData;
  draggingId: string | null;
  dropTarget: DropTarget | null;
  onEdit?: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>, id: string) => void;
  onDrop: (event: DragEvent<HTMLElement>, id: string) => void;
}) {
  const m = useMessages();
  const isStatementPayment = row.settlement?.kind === "statement";
  const displayType: TxType = isStatementPayment ? "expense" : row.type;
  const amountTone =
    displayType === "income" ? "income" : displayType === "expense" ? "danger" : "default";
  const amountPrefix = displayType === "income" ? "+" : "−";
  const isDragging = draggingId === row.id;
  const isDropBefore = dropTarget?.id === row.id && dropTarget.position === "before";
  const isDropAfter = dropTarget?.id === row.id && dropTarget.position === "after";

  return (
    <article
      className={[
        styles.row,
        isDragging && styles.rowDragging,
        isDropBefore && styles.rowDropBefore,
        isDropAfter && styles.rowDropAfter,
      ]
        .filter(Boolean)
        .join(" ")}
      data-type={displayType}
      onDragOver={(event) => onDragOver(event, row.id)}
      onDrop={(event) => onDrop(event, row.id)}
    >
      <div className={styles.rowHandle}>
        <button
          type="button"
          className={styles.dragHandle}
          draggable
          aria-label={fmt(m.common.aria.reorderDescription, { description: row.description })}
          title={m.common.aria.dragToReorder}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", row.id);
            onDragStart(row.id);
          }}
          onDragEnd={onDragEnd}
        >
          <span className={styles.dragHandleIcon} aria-hidden="true">
            ⠿
          </span>
        </button>
      </div>

      <div className={styles.rowDate}>
        <FormattedDate isoDate={row.effectiveDate} />
      </div>

      <div>
        <Chip variant={txTypeChipVariant(displayType)}>{txTypeLabel(m, displayType)}</Chip>
      </div>

      <div className={styles.rowDescription}>
        {isStatementPayment ? (row.settlement?.label ?? row.description) : row.description}
      </div>

      <div
        className={[styles.rowCategory, !row.categoryName && styles.cellEmpty]
          .filter(Boolean)
          .join(" ")}
      >
        {row.categoryName ?? m.common.dash}
      </div>

      <div className={styles.rowAccount}>{row.accountName}</div>

      <div
        className={[styles.rowTo, !row.toAccountName && styles.cellEmpty].filter(Boolean).join(" ")}
      >
        {row.toAccountName ?? m.common.dash}
      </div>

      <div className={[styles.rowAmount, styles[`amount${displayType}`]].filter(Boolean).join(" ")}>
        <span className={styles.amountPrefix} aria-hidden="true">
          {amountPrefix}
        </span>
        <MoneyAmount cents={row.amountCents} tone={amountTone} />
      </div>

      <div className={styles.rowSettles}>
        {row.settlement && (
          <Chip
            variant={
              row.settlement.kind === "planned"
                ? "planned"
                : row.settlement.kind === "installment"
                  ? "installment"
                  : "statement"
            }
          >
            {row.settlement.kind === "planned"
              ? m.common.chips.planned
              : row.settlement.kind === "installment"
                ? m.common.chips.installment
                : m.common.chips.statement}
          </Chip>
        )}
      </div>

      <div className={styles.rowActions}>
        <IconButton
          title={m.transactions.editTransaction}
          aria-label={fmt(m.common.aria.editDescription, { description: row.description })}
          onClick={() => onEdit?.(row.id)}
        >
          ✎
        </IconButton>
      </div>
    </article>
  );
}

export function TransactionsScreen({
  transactions,
  totalCount,
  hasMore,
  accountOptions,
  categoryOptions,
  filters,
  workingBalanceCents,
  status = "ready",
  errorMessage,
  editor,
  onFiltersChange,
  onLoadMore,
  onAddTransaction,
  onEdit,
  onReorder,
}: Props) {
  const m = useMessages();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const typeFilter: TypeFilter = filters.type ?? "all";
  const activeFilterCount = countActiveFilters(filters);
  const hasLedger = totalCount > 0 || activeFilterCount > 0;
  const isFilteredEmpty = hasLedger && transactions.length === 0;

  const patchFilters = (patch: Partial<TransactionFiltersState>) => {
    onFiltersChange?.({ ...filters, ...patch });
  };

  const clearFilters = () => onFiltersChange?.({});

  const clearDragState = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const canDropOn = (draggedId: string | null, targetId: string): boolean => {
    if (!draggedId || draggedId === targetId) return false;
    const draggedRow = transactions.find((row) => row.id === draggedId);
    const targetRow = transactions.find((row) => row.id === targetId);
    return Boolean(draggedRow && targetRow && draggedRow.effectiveDate === targetRow.effectiveDate);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>, targetId: string) => {
    if (!canDropOn(draggingId, targetId)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const rect = event.currentTarget.getBoundingClientRect();
    const position: ReorderPosition =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDropTarget({ id: targetId, position });
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    if (!draggingId || !dropTarget || !canDropOn(draggingId, targetId)) {
      clearDragState();
      return;
    }

    onReorder?.(draggingId, dropTarget.id, dropTarget.position);
    clearDragState();
  };

  if (status === "loading") {
    return (
      <div className={styles.statusPage}>
        <h2 className={styles.statusTitle}>{m.transactions.loading.title}</h2>
        <p>{m.transactions.loading.description}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.statusPage}>
        <h2 className={styles.statusTitle}>{m.transactions.error.title}</h2>
        <p>{errorMessage ?? m.common.errorFallback}</p>
      </div>
    );
  }

  return (
    <>
      <HeaderStrip
        metric={
          <Metric label={m.common.workingBalance}>
            <MoneyAmount cents={workingBalanceCents} />
          </Metric>
        }
        action={
          <Button variant="primary" onClick={onAddTransaction}>
            {m.transactions.addTransaction}
          </Button>
        }
      />

      <div className={styles.page}>
        <PageHeader title={m.transactions.title} subtitle={m.transactions.subtitle} />

        {!hasLedger ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              📒
            </div>
            <h2 className={styles.emptyTitle}>{m.transactions.empty.title}</h2>
            <p className={styles.emptyDesc}>{m.transactions.empty.description}</p>
            <Button variant="primary" onClick={onAddTransaction}>
              {m.transactions.addTransaction}
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.filtersCard}>
              <div className={styles.filtersHeader}>
                <div className={styles.typeFilters}>
                  <SegmentedControl
                    aria-label={m.common.aria.filterByType}
                    value={typeFilter}
                    onChange={(type) => patchFilters({ type: type === "all" ? undefined : type })}
                    options={[
                      { value: "all", label: m.transactions.allTypes },
                      { value: "income", label: txTypeLabel(m, "income") },
                      { value: "expense", label: txTypeLabel(m, "expense") },
                      { value: "transfer", label: txTypeLabel(m, "transfer") },
                    ]}
                  />
                </div>

                <div className={styles.filtersMeta}>
                  {!filtersExpanded && (
                    <span className={styles.filtersSummary}>
                      {activeFilterCount === 0
                        ? m.transactions.allTransactions
                        : fmt(m.transactions.filterActive, {
                            count: activeFilterCount,
                            suffix:
                              activeFilterCount === 1
                                ? m.transactions.filter
                                : m.transactions.filterPlural,
                          })}
                    </span>
                  )}
                  <button
                    type="button"
                    className={styles.filtersToggle}
                    aria-expanded={filtersExpanded}
                    aria-controls="transaction-filters-detail"
                    aria-label={
                      filtersExpanded
                        ? m.transactions.collapseFilters
                        : m.transactions.expandFilters
                    }
                    onClick={() => setFiltersExpanded((expanded) => !expanded)}
                  >
                    {filtersExpanded ? m.transactions.hideFilters : m.transactions.moreFilters}
                    <span className={styles.filtersToggleIcon} aria-hidden="true">
                      {filtersExpanded ? "▴" : "▾"}
                    </span>
                  </button>
                </div>
              </div>

              {filtersExpanded && (
                <div
                  id="transaction-filters-detail"
                  className={styles.filtersDetail}
                  aria-label={m.transactions.transactionFilters}
                >
                  <div className={styles.filterGrid}>
                    <div className={styles.filterField}>
                      <label className={styles.filterLabel} htmlFor="filter-account">
                        {m.transactions.account}
                      </label>
                      <select
                        id="filter-account"
                        className={styles.filterSelect}
                        value={filters.accountId ?? ""}
                        onChange={(e) => patchFilters({ accountId: e.target.value || undefined })}
                      >
                        <option value="">{m.transactions.allAccounts}</option>
                        {accountOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.filterField}>
                      <label className={styles.filterLabel} htmlFor="filter-category">
                        {m.transactions.category}
                      </label>
                      <select
                        id="filter-category"
                        className={styles.filterSelect}
                        value={filters.categoryId ?? ""}
                        onChange={(e) => patchFilters({ categoryId: e.target.value || undefined })}
                      >
                        <option value="">{m.transactions.allCategories}</option>
                        {categoryOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.filterField}>
                      <label className={styles.filterLabel} htmlFor="filter-from">
                        {m.transactions.from}
                      </label>
                      <input
                        id="filter-from"
                        type="date"
                        className={styles.filterInput}
                        value={filters.dateFrom ?? ""}
                        onChange={(e) => patchFilters({ dateFrom: e.target.value || undefined })}
                      />
                    </div>

                    <div className={styles.filterField}>
                      <label className={styles.filterLabel} htmlFor="filter-to">
                        {m.transactions.to}
                      </label>
                      <input
                        id="filter-to"
                        type="date"
                        className={styles.filterInput}
                        value={filters.dateTo ?? ""}
                        onChange={(e) => patchFilters({ dateTo: e.target.value || undefined })}
                      />
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <div className={styles.activeFilters} aria-label={m.common.aria.activeFilters}>
                      <span className={styles.activeFiltersLabel}>{m.common.active}</span>
                      <div className={styles.activePills}>
                        {filters.type && (
                          <button
                            type="button"
                            className={styles.activePill}
                            onClick={() => patchFilters({ type: undefined })}
                          >
                            {txTypeLabel(m, filters.type)}
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                        {filters.accountId && (
                          <button
                            type="button"
                            className={styles.activePill}
                            onClick={() => patchFilters({ accountId: undefined })}
                          >
                            {accountOptions.find((a) => a.id === filters.accountId)?.name ??
                              m.transactions.account}
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                        {filters.categoryId && (
                          <button
                            type="button"
                            className={styles.activePill}
                            onClick={() => patchFilters({ categoryId: undefined })}
                          >
                            {categoryOptions.find((c) => c.id === filters.categoryId)?.name ??
                              m.transactions.category}
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                        {filters.dateFrom && (
                          <button
                            type="button"
                            className={styles.activePill}
                            onClick={() => patchFilters({ dateFrom: undefined })}
                          >
                            {m.transactions.from} {filters.dateFrom}
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                        {filters.dateTo && (
                          <button
                            type="button"
                            className={styles.activePill}
                            onClick={() => patchFilters({ dateTo: undefined })}
                          >
                            {m.transactions.to} {filters.dateTo}
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                      </div>
                      <button type="button" className={styles.clearAll} onClick={clearFilters}>
                        {m.common.clearAll}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.toolbar}>
              <p className={styles.toolbarCount}>
                {fmt(m.transactions.showingSummary, {
                  shown: transactions.length,
                  ofTotal:
                    totalCount !== transactions.length
                      ? fmt(m.transactions.showingSummaryOf, { total: totalCount })
                      : "",
                  suffix:
                    totalCount === 1
                      ? m.transactions.showingSummarySuffixOne
                      : m.transactions.showingSummarySuffixMany,
                })}
              </p>
            </div>

            {isFilteredEmpty ? (
              <div className={styles.noResults}>
                <h2 className={styles.noResultsTitle}>{m.transactions.noMatching.title}</h2>
                <p className={styles.noResultsDesc}>{m.transactions.noMatching.description}</p>
                <Button variant="ghost" onClick={clearFilters}>
                  {m.transactions.clearFilters}
                </Button>
              </div>
            ) : (
              <>
                <section className={styles.list} aria-label={m.common.aria.transactionList}>
                  <div className={styles.listHeader}>
                    <span aria-hidden="true" />
                    <span>{m.transactions.headers.date}</span>
                    <span>{m.transactions.headers.type}</span>
                    <span>{m.transactions.headers.description}</span>
                    <span>{m.transactions.headers.category}</span>
                    <span>{m.transactions.headers.account}</span>
                    <span>{m.transactions.headers.to}</span>
                    <span>{m.transactions.headers.amount}</span>
                    <span>{m.transactions.headers.settles}</span>
                    <span />
                  </div>

                  {transactions.map((row) => (
                    <TransactionRow
                      key={row.id}
                      row={row}
                      draggingId={draggingId}
                      dropTarget={dropTarget}
                      onEdit={onEdit}
                      onDragStart={setDraggingId}
                      onDragEnd={clearDragState}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                  ))}
                </section>

                {hasMore && (
                  <div className={styles.loadMore}>
                    <Button variant="ghost" onClick={onLoadMore}>
                      {m.transactions.loadMore}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {editor}
    </>
  );
}
