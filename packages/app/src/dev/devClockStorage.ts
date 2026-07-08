import { compareIso, todayIso } from "@cashflow/core";
import { SEED_ANCHOR_DATE } from "../data/seed/bootstrap";
import { devToolsEnabled } from "./devToolsEnabled";

export const DEV_CLOCK_STORAGE_KEY = "cashflow:devClock";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseStoredClockToday(raw: string | null, fallback = SEED_ANCHOR_DATE): string {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { today?: unknown };
    if (typeof parsed.today === "string" && ISO_DATE_RE.test(parsed.today)) {
      if (compareIso(parsed.today, SEED_ANCHOR_DATE) >= 0) {
        return parsed.today;
      }
    }
  } catch {
    // invalid JSON falls back
  }
  return fallback;
}

export function readStoredClockToday(): string {
  if (!devToolsEnabled) return todayIso();
  if (typeof sessionStorage === "undefined") return SEED_ANCHOR_DATE;
  return parseStoredClockToday(sessionStorage.getItem(DEV_CLOCK_STORAGE_KEY));
}

export function writeStoredClockToday(iso: string): void {
  if (!devToolsEnabled || typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(DEV_CLOCK_STORAGE_KEY, JSON.stringify({ today: iso }));
}

export function clearStoredClockToday(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(DEV_CLOCK_STORAGE_KEY);
}

export function assertForwardDate(current: string, next: string): string | null {
  if (compareIso(next, current) < 0) {
    return "Cannot travel to a date before the current simulated date.";
  }
  if (!ISO_DATE_RE.test(next)) {
    return "Enter a valid date (YYYY-MM-DD).";
  }
  return null;
}
