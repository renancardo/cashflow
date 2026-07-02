import type { EngineInput } from "@cashflow/core";

/** Parse Brazilian-real strings ("1.234,56" or "47,07") to integer cents. */
export function brlToCents(value: string | number): number {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  return Math.round(parseFloat(normalized) * 100);
}

/** Convert DD/MM/YYYY to ISO YYYY-MM-DD. */
export function brDateToIso(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
}

let idCounter = 0;

/** Generate deterministic fixture IDs within a namespace. */
export function fixtureId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter).padStart(4, "0")}`;
}

export function resetFixtureIds(): void {
  idCounter = 0;
}

/** Shape check for EngineInput — used in tests and fixture validation. */
export function assertEngineInputShape(input: EngineInput): EngineInput {
  const requiredArrays = [
    "accounts",
    "transactions",
    "plannedItems",
    "plannedItemOverrides",
    "creditCardStatements",
    "installments",
    "installmentPlans",
  ] as const;

  for (const key of requiredArrays) {
    if (!Array.isArray(input[key])) {
      throw new Error(`Fixture missing array: ${key}`);
    }
  }

  if (!input.settings?.horizonMonths) {
    throw new Error("Fixture missing settings.horizonMonths");
  }

  return input;
}
