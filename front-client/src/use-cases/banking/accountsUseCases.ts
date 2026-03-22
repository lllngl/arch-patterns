import { bankingApi } from "../../api/bankingApi";
import type { AccountDTO, PageRequestParams } from "../../contracts/banking";

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

export async function depositToAccount(accountId: string, amount: number): Promise<AccountDTO> {
  return bankingApi.deposit(accountId, amount);
}

export async function withdrawFromAccount(accountId: string, amount: number): Promise<AccountDTO> {
  return bankingApi.withdraw(accountId, amount);
}
