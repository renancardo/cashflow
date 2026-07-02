import type { AccountType } from "@cashflow/core";
import { Chip } from "../../atoms/Chip/Chip.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { IconButton } from "../../molecules/IconButton/IconButton.js";
import { ACCOUNT_TYPE_LABELS, accountTypeChipVariant } from "../../lib/account-types.js";
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
  workingDisabled?: boolean;
};

export function AccountRow({ account, onWorkingChange, onEdit, workingDisabled }: Props) {
  const isCreditCard = account.type === "credit_card";

  return (
    <article className={styles.row}>
      <div className={styles.info}>
        <div className={styles.name}>{account.name}</div>
        <div className={styles.meta}>
          <Chip variant={accountTypeChipVariant(account.type)}>
            {ACCOUNT_TYPE_LABELS[account.type]}
          </Chip>
        </div>
      </div>
      <div className={styles.working}>
        <Toggle
          checked={account.isWorking}
          disabled={workingDisabled ?? isCreditCard}
          aria-label={account.isWorking ? "Working account" : "Not working"}
          onChange={(checked) => onWorkingChange?.(account.id, checked)}
        />
      </div>
      <div className={[styles.balance, isCreditCard && styles.debt].filter(Boolean).join(" ")}>
        {isCreditCard && <span className={styles.balanceLabel}>Owed</span>}
        <MoneyAmount cents={account.balanceCents} tone={isCreditCard ? "danger" : "default"} />
      </div>
      <div className={styles.actions}>
        <IconButton title="Edit" aria-label={`Edit ${account.name}`} onClick={() => onEdit?.(account.id)}>
          ✎
        </IconButton>
      </div>
    </article>
  );
}
