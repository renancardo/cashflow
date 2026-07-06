import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { daysUntil } from "../../lib/calendar.js";
import { useLanguage, useMessages } from "../../i18n/LanguageContext.js";
import { fmt } from "@cashflow/core";
import styles from "./CalendarHeaderMetrics.module.css";

type Props = {
  workingBalanceCents: number;
  nextNegativeDate: string | null;
  today: string;
};

export function CalendarHeaderMetrics({ workingBalanceCents, nextNegativeDate, today }: Props) {
  const language = useLanguage();
  const m = useMessages();
  const showAlert = nextNegativeDate !== null;
  const alertDays = nextNegativeDate ? daysUntil(today, nextNegativeDate) : null;

  return (
    <>
      <Metric label={m.calendar.workingBalance}>
        <MoneyAmount cents={workingBalanceCents} language={language} />
      </Metric>
      <Metric label={m.calendar.nextBelowBuffer} tone={nextNegativeDate ? "danger" : "default"}>
        {nextNegativeDate ? (
          <FormattedDate isoDate={nextNegativeDate} language={language} />
        ) : (
          m.calendar.noRiskInHorizon
        )}
      </Metric>
      {showAlert && alertDays !== null && (
        <div className={styles.alertBadge} role="status">
          <span className={styles.alertDot} aria-hidden />
          {fmt(m.calendar.alertNegativeIn, {
            days: alertDays,
            unit: alertDays === 1 ? m.calendar.alertDay : m.calendar.alertDays,
          })}
        </div>
      )}
    </>
  );
}
