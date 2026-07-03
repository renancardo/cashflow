import type { ReactNode } from "react";
import { Button } from "../../atoms/Button/Button.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { SummaryStrip, SummaryStripItem } from "../../molecules/SummaryStrip/SummaryStrip.js";
import { AccountList } from "../AccountList/AccountList.js";
import { AccountRow, type AccountRowData } from "../AccountRow/AccountRow.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import { PageHeader } from "../PageHeader/PageHeader.js";
import styles from "./AccountsScreen.module.css";

type Props = {
  accounts: AccountRowData[];
  workingBalanceCents: number;
  status?: "ready" | "loading" | "error";
  errorMessage?: string;
  editor?: ReactNode;
  onAddAccount?: () => void;
  onWorkingChange?: (id: string, isWorking: boolean) => void;
  onEdit?: (id: string) => void;
};

export function AccountsScreen({
  accounts,
  workingBalanceCents,
  status = "ready",
  errorMessage,
  editor,
  onAddAccount,
  onWorkingChange,
  onEdit,
}: Props) {
  const workingCount = accounts.filter((account) => account.isWorking).length;

  if (status === "loading") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>Loading accounts…</h2>
        <p>Fetching balances and settings.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>Could not load accounts</h2>
        <p>{errorMessage ?? "Something went wrong. Try again."}</p>
      </div>
    );
  }

  return (
    <>
      <HeaderStrip
        metric={
          accounts.length > 0 ? (
            <Metric label="Working balance">
              <MoneyAmount cents={workingBalanceCents} />
            </Metric>
          ) : null
        }
        action={
          <Button variant="primary" onClick={onAddAccount}>
            + Add account
          </Button>
        }
      />

      <div className={styles.page}>
        <PageHeader
          title="Accounts"
          subtitle="Manage balances, working flags, and credit card cycles"
        />

        {accounts.length > 0 && (
          <SummaryStrip className={styles.summary}>
            <SummaryStripItem label="Total accounts">{accounts.length}</SummaryStripItem>
            <SummaryStripItem label="Working accounts" tone="working">
              {workingCount}
            </SummaryStripItem>
            <SummaryStripItem label="Aggregate working">
              <MoneyAmount cents={workingBalanceCents} />
            </SummaryStripItem>
          </SummaryStrip>
        )}

        <AccountList empty={accounts.length === 0} onAddAccount={onAddAccount}>
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onWorkingChange={onWorkingChange}
              onEdit={onEdit}
            />
          ))}
        </AccountList>
      </div>

      {editor}
    </>
  );
}
