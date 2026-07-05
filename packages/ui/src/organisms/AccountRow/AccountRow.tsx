import type { AccountType } from "@cashflow/core";
import { accountTypeLabel, accountTypeChipVariant, fmt } from "@cashflow/core";
import { Chip } from "../../atoms/Chip/Chip.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import styles from "./AccountRow.module.css";

export type AccountRowData = {
  id: string;
  name: string;
  type: AccountType;
  isWorking: boolean;
  balanceCents: number;
  anchorDate: string;
};

type Props = {
  account: AccountRowData;
  onWorkingChange?: (id: string, isWorking: boolean) => void;
  onEdit?: (id: string) => void;
  onStatements?: (id: string) => void;
  workingDisabled?: boolean;
};

export function AccountRow({
  account,
  onWorkingChange,
  onEdit,
  onStatements,
  workingDisabled,
}: Props) {
  const m = useMessages();
  const isCreditCard = account.type === "credit_card";

  return (
    <article className={styles.row}>
      <div className={styles.info}>
        <div className={styles.name}>{account.name}</div>
        <div className={styles.meta}>
          <Chip variant={accountTypeChipVariant(account.type)}>
            {accountTypeLabel(m, account.type)}
          </Chip>
        </div>
      </div>
      <div className={styles.working}>
        <Toggle
          checked={account.isWorking}
          disabled={workingDisabled ?? isCreditCard}
          aria-label={account.isWorking ? m.accounts.working.on : m.accounts.working.off}
          onChange={(checked) => onWorkingChange?.(account.id, checked)}
        />
      </div>
      <div className={[styles.balance, isCreditCard && styles.debt].filter(Boolean).join(" ")}>
        {isCreditCard && <span className={styles.balanceLabel}>{m.common.owed}</span>}
        <MoneyAmount cents={account.balanceCents} tone={isCreditCard ? "danger" : "default"} />
      </div>
      <div className={styles.actions}>
        {isCreditCard && onStatements && (
          <IconButton
            title={m.common.statements}
            aria-label={fmt(m.common.aria.viewStatementsFor, { name: account.name })}
            onClick={() => onStatements(account.id)}
          >
            📄
          </IconButton>
        )}
        <IconButton
          title={m.common.edit}
          aria-label={fmt(m.common.aria.editName, { name: account.name })}
          onClick={() => onEdit?.(account.id)}
        >
          ✎
        </IconButton>
      </div>
    </article>
  );
}
