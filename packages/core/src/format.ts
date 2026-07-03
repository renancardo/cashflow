import type { Language } from "./entities.js";

const PT_BR = "pt-BR";
const EN = "en";

export function formatMoney(cents: number, language: Language = PT_BR): string {
  const amount = cents / 100;
  const locale = language === EN ? "en-US" : "pt-BR";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(isoDate: string, language: Language = PT_BR): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const locale = language === EN ? "en-US" : "pt-BR";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Decimal string for money input fields (e.g. "1850.00"). Empty when cents is undefined. */
export function formatCents(cents: number | undefined): string {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

/** Parses a typed money string into integer cents. Accepts comma or dot decimals. */
export function parseMoney(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(Math.abs(parsed) * 100) : undefined;
}
