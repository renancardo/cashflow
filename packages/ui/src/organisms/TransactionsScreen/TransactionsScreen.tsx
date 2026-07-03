import type { ReactNode } from "react";
import type { TxType } from "@cashflow/core";
import { TX_TYPE_LABELS, txTypeChipVariant } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import { PageHeader } from "../PageHeader/PageHeader.js";
import styles from "./TransactionsScreen.module.css";

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
};

export type TransactionFiltersState = {
  type?: TxType;
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type Option = { id: string; name: string };

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
  onEdit,
}: {
  row: TransactionRowData;
  onEdit?: (id: string) => void;
}) {
  const amountTone = row.type === "income" ? "income" : row.type === "expense" ? "danger" : "default";
  const amountPrefix = row.type === "income" ? "+" : "−";

  return (
    <article className={styles.row} data-type={row.type}>
      <div className={styles.rowDate}>
        <FormattedDate isoDate={row.effectiveDate} />
      </div>

      <div>
        <Chip variant={txTypeChipVariant(row.type)}>{TX_TYPE_LABELS[row.type]}</Chip>
      </div>

      <div className={styles.rowDescription}>{row.description}</div>

      <div className={[styles.rowCategory, !row.categoryName && styles.cellEmpty].filter(Boolean).join(" ")}>
        {row.categoryName ?? "—"}
      </div>

      <div className={styles.rowAccount}>{row.accountName}</div>

      <div className={[styles.rowTo, !row.toAccountName && styles.cellEmpty].filter(Boolean).join(" ")}>
        {row.toAccountName ?? "—"}
      </div>

      <div className={[styles.rowAmount, styles[`amount${row.type}`]].filter(Boolean).join(" ")}>
        <span className={styles.amountPrefix} aria-hidden="true">
          {amountPrefix}
        </span>
        <MoneyAmount cents={row.amountCents} tone={amountTone} />
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
}: Props) {
  const typeFilter: TypeFilter = filters.type ?? "all";
  const activeFilterCount = countActiveFilters(filters);
  const hasLedger = totalCount > 0 || activeFilterCount > 0;
  const isFilteredEmpty = hasLedger && transactions.length === 0;

  const patchFilters = (patch: Partial<TransactionFiltersState>) => {
    onFiltersChange?.({ ...filters, ...patch });
  };

  const clearFilters = () => onFiltersChange?.({});

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
              <div className={styles.typeFilters} role="group" aria-label="Filter by type">
                {(["all", "income", "expense", "transfer"] as TypeFilter[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={[styles.typeChip, typeFilter === type && styles.typeChipActive]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      patchFilters({ type: type === "all" ? undefined : type })
                    }
                  >
                    {type === "all" ? "All types" : TX_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              <div className={styles.filterGrid} aria-label="Transaction filters">
                <div className={styles.filterField}>
                  <label className={styles.filterLabel} htmlFor="filter-account">
                    Account
                  </label>
                  <select
                    id="filter-account"
                    className={styles.filterSelect}
                    value={filters.accountId ?? ""}
                    onChange={(e) =>
                      patchFilters({ accountId: e.target.value || undefined })
                    }
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
                    onChange={(e) =>
                      patchFilters({ categoryId: e.target.value || undefined })
                    }
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
                        {accountOptions.find((a) => a.id === filters.accountId)?.name ?? "Account"}
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
                    <span>Date</span>
                    <span>Type</span>
                    <span>Description</span>
                    <span>Category</span>
                    <span>Account</span>
                    <span>To</span>
                    <span>Amount</span>
                    <span />
                  </div>

                  {transactions.map((row) => (
                    <TransactionRow key={row.id} row={row} onEdit={onEdit} />
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
