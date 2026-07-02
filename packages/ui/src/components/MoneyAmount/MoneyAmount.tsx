import type { Language } from "@cashflow/core";
import { formatMoney } from "@cashflow/core";
import styles from "./MoneyAmount.module.css";

type Props = {
  cents: number;
  language?: Language;
  className?: string;
};

export function MoneyAmount({ cents, language = "pt-BR", className }: Props) {
  return (
    <span className={[styles.amount, className].filter(Boolean).join(" ")}>
      {formatMoney(cents, language)}
    </span>
  );
}
