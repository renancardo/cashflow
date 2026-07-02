import type { Language } from "@cashflow/core";
import { formatMoney } from "@cashflow/core";
import styles from "./MoneyAmount.module.css";

type Props = {
  cents: number;
  language?: Language;
  tone?: "default" | "income" | "danger";
  className?: string;
};

export function MoneyAmount({ cents, language = "pt-BR", tone = "default", className }: Props) {
  return (
    <span className={[styles.amount, styles[tone], className].filter(Boolean).join(" ")}>
      {formatMoney(cents, language)}
    </span>
  );
}
