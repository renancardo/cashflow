import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { todayIso } from "@cashflow/core";
import { DayDetailPanel, MonthCalendarScreen, type QuickAddValues } from "@cashflow/ui";
import { validateCalendarQuickAdd } from "../data/mutations/calendarQuickAdd";
import { useCalendarQuickAdd } from "../data/mutations/useCalendarQuickAdd";
import { createEmptyTransactionInput } from "../data/mutations/useTransactionMutations";
import { useAccounts } from "../data/queries/useAccounts";
import { useCalendarScreen } from "../data/queries/useCalendarScreen";

type Props = {
  month: string;
  selectedDay?: string | null;
  onSelectedDayChange?: (date: string | null) => void;
  onMonthChange?: (month: string) => void;
};

export function MonthCalendarPage({
  month,
  selectedDay = null,
  onSelectedDayChange,
  onMonthChange,
}: Props) {
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useCalendarScreen();
  const { data: accountsData } = useAccounts();
  const quickAdd = useCalendarQuickAdd(data?.today);
  const [quickAddValues, setQuickAddValues] = useState<QuickAddValues>(() => ({
    ...createEmptyTransactionInput(),
    description: "",
  }));

  const selectedDayData = useMemo(() => {
    if (!selectedDay || !data) return null;
    const day = data.projection.days.find((entry) => entry.date === selectedDay);

    if (!day) {
      return {
        date: selectedDay,
        openingBalanceCents: 0,
        inflowsCents: 0,
        outflowsCents: 0,
        closingBalanceCents: 0,
        belowBuffer: false,
        largeOutflow: false,
        items: [],
      };
    }

    return {
      ...day,
      items: day.items.map((item) => ({
        ...item,
        ...data.resolveItemMeta(item),
      })),
    };
  }, [data, selectedDay]);

  const openDay = (date: string) => {
    onSelectedDayChange?.(date);
    setQuickAddValues((current) => ({
      ...createEmptyTransactionInput(data?.accountOptions[0]?.id, data?.settings.defaultCurrency),
      description: "",
      effectiveDate: date,
      type: current.type,
      categoryId: current.categoryId,
    }));
  };

  const closeDay = () => {
    onSelectedDayChange?.(null);
  };

  const handleQuickAddSubmit = async () => {
    if (!data || !selectedDay) return;
    const validationError = validateCalendarQuickAdd(quickAddValues, data.accountOptions);
    if (validationError) return;

    await quickAdd.mutateAsync({ ...quickAddValues, effectiveDate: selectedDay });

    setQuickAddValues((current) => ({
      ...createEmptyTransactionInput(data.accountOptions[0]?.id, data.settings.defaultCurrency),
      description: "",
      effectiveDate: selectedDay,
      type: current.type,
    }));
  };

  return (
    <MonthCalendarScreen
      month={month}
      days={data?.projection.days ?? []}
      workingBalanceCents={accountsData?.workingBalanceCents ?? 0}
      nextNegativeDate={data?.projection.nextNegativeDate ?? null}
      today={data?.today ?? todayIso()}
      selectedDate={selectedDay}
      status={isPending ? "loading" : isError ? "error" : "ready"}
      errorMessage={error instanceof Error ? error.message : undefined}
      onMonthChange={onMonthChange}
      onYearView={() => navigate({ to: "/" })}
      onDaySelect={openDay}
      dayPanel={
        <DayDetailPanel
          open={Boolean(selectedDay)}
          day={selectedDayData}
          quickAddValues={
            selectedDay ? { ...quickAddValues, effectiveDate: selectedDay } : quickAddValues
          }
          currency={data?.settings.defaultCurrency ?? "BRL"}
          accountOptions={data?.accountOptions ?? []}
          categoryOptions={data?.categoryOptions ?? []}
          saving={quickAdd.isPending}
          onQuickAddChange={(patch) => setQuickAddValues((current) => ({ ...current, ...patch }))}
          onQuickAddSubmit={handleQuickAddSubmit}
          onClose={closeDay}
        />
      }
    />
  );
}
