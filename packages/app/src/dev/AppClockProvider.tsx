import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addDays, todayIso } from "@cashflow/core";
import { materializeAllCreditCardStatements } from "@cashflow/db";
import { bootstrapSeed, SEED_ANCHOR_DATE } from "../data/seed/bootstrap";
import { assertForwardDate, readStoredClockToday, writeStoredClockToday } from "./devClockStorage";
import { devToolsEnabled } from "./devToolsEnabled";
import { invalidateDateSensitiveQueries } from "./invalidateDateQueries";

/**
 * Wired call sites (packages/app): useProjection, useCalendarScreen, useAccounts,
 * useForecastScreen, useStatementDetail, useStatements, useCalendarQuickAdd,
 * usePlannedItemMutations, useInstallmentMutations, useStatementMutations,
 * useSettingsMutations (import rematerialize), createEmpty* editors, CalendarPage,
 * MonthCalendarPage, CategoriesPage, router month redirect.
 */
export type AppClock = {
  /** Effective today for the whole app. Seed anchor in dev; real date in production. */
  today: string;
  /** Set simulated today. Forward-only: rejects iso < today. */
  setToday: (iso: string) => boolean;
  /** Reset DB to seed and today to SEED_ANCHOR_DATE. */
  restoreSeed: () => void;
  /** Last forward-only rejection message, cleared on success. */
  setTodayError: string | null;
  /** Whether dev time travel is active. */
  isSimulated: boolean;
};

const AppClockContext = createContext<AppClock | null>(null);

function useProductionClock(): AppClock {
  const today = todayIso();
  return useMemo(
    () => ({
      today,
      setToday: () => false,
      restoreSeed: () => {},
      setTodayError: null,
      isSimulated: false,
    }),
    [today],
  );
}

function DevAppClockProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [today, setTodayState] = useState(readStoredClockToday);
  const [setTodayError, setSetTodayError] = useState<string | null>(null);

  const setToday = useCallback(
    (iso: string): boolean => {
      const error = assertForwardDate(today, iso);
      if (error) {
        setSetTodayError(error);
        return false;
      }
      if (iso === today) {
        setSetTodayError(null);
        return true;
      }

      const previousToday = today;
      writeStoredClockToday(iso);
      setTodayState(iso);
      setSetTodayError(null);
      materializeAllCreditCardStatements(iso);
      invalidateDateSensitiveQueries(queryClient, previousToday, iso);
      return true;
    },
    [queryClient, today],
  );

  const restoreSeed = useCallback(() => {
    bootstrapSeed(SEED_ANCHOR_DATE);
    writeStoredClockToday(SEED_ANCHOR_DATE);
    setTodayState(SEED_ANCHOR_DATE);
    setSetTodayError(null);
    queryClient.invalidateQueries();
  }, [queryClient]);

  const value = useMemo<AppClock>(
    () => ({
      today,
      setToday,
      restoreSeed,
      setTodayError,
      isSimulated: true,
    }),
    [today, setToday, restoreSeed, setTodayError],
  );

  return <AppClockContext.Provider value={value}>{children}</AppClockContext.Provider>;
}

function ProductionAppClockBridge({ children }: { children: ReactNode }) {
  const value = useProductionClock();
  return <AppClockContext.Provider value={value}>{children}</AppClockContext.Provider>;
}

export function AppClockProvider({ children }: { children: ReactNode }) {
  if (!devToolsEnabled) {
    return <ProductionAppClockBridge>{children}</ProductionAppClockBridge>;
  }

  return <DevAppClockProvider>{children}</DevAppClockProvider>;
}

export function useAppClock(): AppClock {
  const context = useContext(AppClockContext);
  if (!context) {
    throw new Error("useAppClock must be used within AppClockProvider");
  }
  return context;
}

export { SEED_ANCHOR_DATE, addDays };
