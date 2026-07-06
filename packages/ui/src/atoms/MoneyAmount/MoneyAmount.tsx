import type { Language } from "@cashflow/core";
import { formatMoney } from "@cashflow/core";
import { useLanguage } from "../../i18n/LanguageContext.js";
import styles from "./MoneyAmount.module.css";

type Props = {
  cents: number;
  language?: Language;
  tone?: "default" | "income" | "danger";
  className?: string;
};

export function MoneyAmount({ cents, language, tone = "default", className }: Props) {
  const contextLanguage = useLanguage();
  const resolvedLanguage = language ?? contextLanguage;

  return (
    <span className={[styles.amount, styles[tone], className].filter(Boolean).join(" ")}>
      {formatMoney(cents, resolvedLanguage)}
    </span>
  );
}
