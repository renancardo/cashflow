import type { Language } from "@cashflow/core";
import { formatDate } from "@cashflow/core";
import styles from "./FormattedDate.module.css";

type Props = {
  isoDate: string;
  language?: Language;
  className?: string;
};

export function FormattedDate({ isoDate, language = "pt-BR", className }: Props) {
  return (
    <time dateTime={isoDate} className={[styles.date, className].filter(Boolean).join(" ")}>
      {formatDate(isoDate, language)}
    </time>
  );
}
