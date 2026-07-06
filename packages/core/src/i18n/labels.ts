import type { AccountType, TxType } from "../entities.js";
import type { Messages } from "./messages.js";

export function txTypeLabel(m: Messages, type: TxType): string {
  return m.common.txTypes[type];
}

export function accountTypeLabel(m: Messages, type: AccountType): string {
  return m.common.accountTypes[type];
}
