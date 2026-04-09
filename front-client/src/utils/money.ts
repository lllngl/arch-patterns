import type { CurrencyCode } from "../contracts/banking";

export function formatMoney(amount: number, currency: CurrencyCode = "RUB"): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(amount);
}

export function isCreditLedgerType(type: string): boolean {
  return type === "INCOME" || type === "TRANSFER_IN" || type === "MASTER_IN";
}
