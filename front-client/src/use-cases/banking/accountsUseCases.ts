import { bankingApi } from "../../api/bankingApi";
import type { AccountDTO, CurrencyCode, PageRequestParams } from "../../contracts/banking";

export async function fetchUserAccounts(userId: string, params: PageRequestParams = {}) {
  return bankingApi.getUserAccounts(userId, params);
}

export async function fetchTransactions(accountId: string, params: PageRequestParams = {}) {
  return bankingApi.getTransactions(accountId, params);
}

export async function openAccount(userId: string, name: string): Promise<AccountDTO> {
  return bankingApi.createAccount(userId, name);
}

export async function closeUserAccount(accountId: string): Promise<void> {
  return bankingApi.closeAccount(accountId);
}

export async function depositToAccount(
  accountId: string,
  amount: number,
  operationCurrency: CurrencyCode | null
) {
  return bankingApi.deposit(accountId, { amount, operationCurrency });
}

export async function withdrawFromAccount(
  accountId: string,
  amount: number,
  operationCurrency: CurrencyCode | null
) {
  return bankingApi.withdraw(accountId, { amount, operationCurrency });
}
