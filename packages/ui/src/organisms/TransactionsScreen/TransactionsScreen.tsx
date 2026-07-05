import { useState, type DragEvent, type ReactNode } from "react";
import type { TxType } from "@cashflow/core";
import { TX_TYPE_LABELS, txTypeChipVariant } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
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
          aria-label={`Reorder ${row.description}`}
          title="Drag to reorder within the same day"
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
        <Chip variant={txTypeChipVariant(displayType)}>{TX_TYPE_LABELS[displayType]}</Chip>
      </div>

      <div className={styles.rowDescription}>
        {isStatementPayment ? (row.settlement?.label ?? row.description) : row.description}
      </div>

      <div
        className={[styles.rowCategory, !row.categoryName && styles.cellEmpty]
          .filter(Boolean)
          .join(" ")}
      >
        {row.categoryName ?? "—"}
      </div>

      <div className={styles.rowAccount}>{row.accountName}</div>

      <div
        className={[styles.rowTo, !row.toAccountName && styles.cellEmpty].filter(Boolean).join(" ")}
      >
        {row.toAccountName ?? "—"}
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
              ? "Planned"
              : row.settlement.kind === "installment"
                ? "Installment"
                : "Statement"}
          </Chip>
        )}
      </div>

      <div className={styles.rowActions}>
        <IconButton
          title="Edit transaction"
          aria-label={`Edit ${row.description}`}
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
        <h2 className={styles.statusTitle}>Loading transactions…</h2>
        <p>Fetching ledger entries.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.statusPage}>
        <h2 className={styles.statusTitle}>Could not load transactions</h2>
        <p>{errorMessage ?? "Something went wrong. Try again."}</p>
      </div>
    );
  }

  return (
    <>
      <HeaderStrip
        metric={
          <Metric label="Working balance">
            <MoneyAmount cents={workingBalanceCents} />
          </Metric>
        }
        action={
          <Button variant="primary" onClick={onAddTransaction}>
            + Add transaction
          </Button>
        }
      />

      <div className={styles.page}>
        <PageHeader
          title="Transactions"
          subtitle="Chronological ledger with filters — newest first"
        />

        {!hasLedger ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              📒
            </div>
            <h2 className={styles.emptyTitle}>No transactions yet</h2>
            <p className={styles.emptyDesc}>
              Add your first transaction to start tracking income, expenses, and transfers.
            </p>
            <Button variant="primary" onClick={onAddTransaction}>
              + Add transaction
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.filtersCard}>
              <div className={styles.filtersHeader}>
                <div className={styles.typeFilters}>
                  <SegmentedControl
                    aria-label="Filter by type"
                    value={typeFilter}
                    onChange={(type) => patchFilters({ type: type === "all" ? undefined : type })}
                    options={[
                      { value: "all", label: "All types" },
                      { value: "income", label: TX_TYPE_LABELS.income },
                      { value: "expense", label: TX_TYPE_LABELS.expense },
                      { value: "transfer", label: TX_TYPE_LABELS.transfer },
                    ]}
                  />
                </div>

                <div className={styles.filtersMeta}>
                  {!filtersExpanded && (
                    <span className={styles.filtersSummary}>
                      {activeFilterCount === 0
                        ? "All transactions"
                        : `${activeFilterCount} ${activeFilterCount === 1 ? "filter" : "filters"} active`}
                    </span>
                  )}
                  <button
                    type="button"
                    className={styles.filtersToggle}
                    aria-expanded={filtersExpanded}
                    aria-controls="transaction-filters-detail"
                    aria-label={filtersExpanded ? "Collapse filters" : "Expand filters"}
                    onClick={() => setFiltersExpanded((expanded) => !expanded)}
                  >
                    {filtersExpanded ? "Hide filters" : "More filters"}
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
                  aria-label="Transaction filters"
                >
                  <div className={styles.filterGrid}>
                    <div className={styles.filterField}>
                      <label className={styles.filterLabel} htmlFor="filter-account">
                        Account
                      </label>
                      <select
                        id="filter-account"
                        className={styles.filterSelect}
                        value={filters.accountId ?? ""}
                        onChange={(e) => patchFilters({ accountId: e.target.value || undefined })}
                      >
                        <option value="">All accounts</option>
                        {accountOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.filterField}>
                      <label className={styles.filterLabel} htmlFor="filter-category">
                        Category
                      </label>
                      <select
                        id="filter-category"
                        className={styles.filterSelect}
                        value={filters.categoryId ?? ""}
                        onChange={(e) => patchFilters({ categoryId: e.target.value || undefined })}
                      >
                        <option value="">All categories</option>
                        {categoryOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.filterField}>
                      <label className={styles.filterLabel} htmlFor="filter-from">
                        From
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
                        To
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
                    <div className={styles.activeFilters} aria-label="Active filters">
                      <span className={styles.activeFiltersLabel}>Active</span>
                      <div className={styles.activePills}>
                        {filters.type && (
                          <button
                            type="button"
                            className={styles.activePill}
                            onClick={() => patchFilters({ type: undefined })}
                          >
                            {TX_TYPE_LABELS[filters.type]}
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
                              "Account"}
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
                              "Category"}
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                        {filters.dateFrom && (
                          <button
                            type="button"
                            className={styles.activePill}
                            onClick={() => patchFilters({ dateFrom: undefined })}
                          >
                            From {filters.dateFrom}
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                        {filters.dateTo && (
                          <button
                            type="button"
                            className={styles.activePill}
                            onClick={() => patchFilters({ dateTo: undefined })}
                          >
                            To {filters.dateTo}
                            <span aria-hidden="true">×</span>
                          </button>
                        )}
                      </div>
                      <button type="button" className={styles.clearAll} onClick={clearFilters}>
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.toolbar}>
              <p className={styles.toolbarCount}>
                Showing <strong>{transactions.length}</strong>
                {totalCount !== transactions.length ? (
                  <>
                    {" "}
                    of <strong>{totalCount}</strong>
                  </>
                ) : null}{" "}
                {totalCount === 1 ? "transaction" : "transactions"} · sorted by date (newest first)
              </p>
            </div>

            {isFilteredEmpty ? (
              <div className={styles.noResults}>
                <h2 className={styles.noResultsTitle}>No matching transactions</h2>
                <p className={styles.noResultsDesc}>
                  Try adjusting your filters or clear them to see the full ledger.
                </p>
                <Button variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <section className={styles.list} aria-label="Transaction list">
                  <div className={styles.listHeader}>
                    <span aria-hidden="true" />
                    <span>Date</span>
                    <span>Type</span>
                    <span>Description</span>
                    <span>Category</span>
                    <span>Account</span>
                    <span>To</span>
                    <span>Amount</span>
                    <span>Settles</span>
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
                      Load more
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
