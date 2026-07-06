import type { ReactNode } from "react";
import { Button } from "../../atoms/Button/Button.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { SummaryStrip, SummaryStripItem } from "../../molecules/SummaryStrip/SummaryStrip.js";
import { useMessages } from "../../i18n/LanguageContext.js";
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
  onStatements?: (id: string) => void;
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
  onStatements,
}: Props) {
  const m = useMessages();
  const workingCount = accounts.filter((account) => account.isWorking).length;

  if (status === "loading") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>{m.accounts.loading.title}</h2>
        <p>{m.accounts.loading.description}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>{m.accounts.error.title}</h2>
        <p>{errorMessage ?? m.common.errorFallback}</p>
      </div>
    );
  }

  return (
    <>
      <HeaderStrip
        metric={
          accounts.length > 0 ? (
            <Metric label={m.common.workingBalance}>
              <MoneyAmount cents={workingBalanceCents} />
            </Metric>
          ) : null
        }
        action={
          <Button variant="primary" onClick={onAddAccount}>
            {m.accounts.addAccount}
          </Button>
        }
      />

      <div className={styles.page}>
        <PageHeader title={m.accounts.title} subtitle={m.accounts.subtitle} />

        {accounts.length > 0 && (
          <SummaryStrip className={styles.summary}>
            <SummaryStripItem label={m.accounts.totalAccounts}>{accounts.length}</SummaryStripItem>
            <SummaryStripItem label={m.accounts.workingAccounts} tone="working">
              {workingCount}
            </SummaryStripItem>
            <SummaryStripItem label={m.accounts.aggregateWorking}>
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
              onStatements={onStatements}
            />
          ))}
        </AccountList>
      </div>

      {editor}
    </>
  );
}
