import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import { daysUntil } from "../../lib/calendar.js";
import styles from "./CalendarHeaderMetrics.module.css";

type Props = {
  workingBalanceCents: number;
  nextNegativeDate: string | null;
  alertLeadTimeDays: number;
  today: string;
};

export function CalendarHeaderMetrics({
  workingBalanceCents,
  nextNegativeDate,
  alertLeadTimeDays,
  today,
}: Props) {
  const showAlert =
    nextNegativeDate !== null && daysUntil(today, nextNegativeDate) <= alertLeadTimeDays;
  const alertDays = nextNegativeDate ? daysUntil(today, nextNegativeDate) : null;

  return (
    <>
      <Metric label="Working balance">
        <MoneyAmount cents={workingBalanceCents} />
      </Metric>
      <Metric label="Next below buffer" tone={nextNegativeDate ? "danger" : "default"}>
        {nextNegativeDate ? <FormattedDate isoDate={nextNegativeDate} /> : "No risk in horizon"}
      </Metric>
      {showAlert && alertDays !== null && (
        <div className={styles.alertBadge} role="status">
          <span className={styles.alertDot} aria-hidden />
          Alert — negative in {alertDays} {alertDays === 1 ? "day" : "days"}
        </div>
      )}
    </>
  );
}
