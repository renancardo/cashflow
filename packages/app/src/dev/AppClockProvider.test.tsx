import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDatabase, resetDatabase } from "@cashflow/db";
import { bootstrapSeed, SEED_ANCHOR_DATE } from "../data/seed/bootstrap";
import { DEV_CLOCK_STORAGE_KEY } from "./devClockStorage";
import { AppClockProvider, useAppClock } from "./AppClockProvider";

vi.mock("./devToolsEnabled", () => ({
  devToolsEnabled: true,
}));

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppClockProvider>{children}</AppClockProvider>
      </QueryClientProvider>
    );
  };
}

describe("AppClockProvider", () => {
  let queryClient: QueryClient;
  const store = new Map<string, string>();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    resetDatabase();
    bootstrapSeed();
    store.clear();

    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to the seed anchor date", () => {
    const { result } = renderHook(() => useAppClock(), { wrapper: wrapper(queryClient) });
    expect(result.current.today).toBe(SEED_ANCHOR_DATE);
  });

  it("returns sessionStorage forward position when set", () => {
    store.set(DEV_CLOCK_STORAGE_KEY, JSON.stringify({ today: "2026-08-01" }));
    const { result } = renderHook(() => useAppClock(), { wrapper: wrapper(queryClient) });
    expect(result.current.today).toBe("2026-08-01");
  });

  it("rejects backward dates via forward-only guard", () => {
    const { result } = renderHook(() => useAppClock(), { wrapper: wrapper(queryClient) });

    act(() => {
      result.current.setToday("2026-07-01");
    });
    expect(result.current.today).toBe("2026-07-01");

    act(() => {
      result.current.setToday("2026-06-30");
    });

    expect(result.current.today).toBe("2026-07-01");
    expect(result.current.setTodayError).toMatch(/before/i);
  });

  it("restoreSeed resets today and reloads bootstrap seed", () => {
    const { result } = renderHook(() => useAppClock(), { wrapper: wrapper(queryClient) });

    act(() => {
      result.current.setToday("2026-08-01");
    });
    expect(result.current.today).toBe("2026-08-01");

    const db = getDatabase();
    db.transactions = [
      ...db.transactions,
      {
        id: "tx-qa",
        type: "expense",
        amountCents: 100,
        accountId: "acct-cora-checking",
        description: "QA",
        effectiveDate: "2026-08-01",
        sortOrder: 99,
      },
    ];

    act(() => {
      result.current.restoreSeed();
    });

    expect(result.current.today).toBe(SEED_ANCHOR_DATE);
    expect(JSON.parse(store.get(DEV_CLOCK_STORAGE_KEY)!).today).toBe(SEED_ANCHOR_DATE);
    expect(getDatabase().transactions.some((row) => row.id === "tx-qa")).toBe(false);
    expect(getDatabase().transactions.some((row) => row.id === "tx-card-payment")).toBe(true);
  });
});
