import type { Language } from "@cashflow/core";
import { formatDisplayDate } from "@cashflow/core";
import { useDateFormat, useLanguage } from "../../i18n/LanguageContext.js";
import styles from "./FormattedDate.module.css";

type Props = {
  isoDate: string;
  language?: Language;
  dateFormat?: string;
  className?: string;
};

export function FormattedDate({ isoDate, language, dateFormat, className }: Props) {
  const contextLanguage = useLanguage();
  const contextDateFormat = useDateFormat();
  const resolvedLanguage = language ?? contextLanguage;
  const resolvedDateFormat = dateFormat ?? contextDateFormat;

  return (
    <time dateTime={isoDate} className={[styles.date, className].filter(Boolean).join(" ")}>
      {formatDisplayDate(isoDate, resolvedLanguage, resolvedDateFormat)}
    </time>
  );
}
