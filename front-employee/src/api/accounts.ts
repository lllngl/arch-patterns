import { api } from "./client";
import type {
  AccountDTO,
  AccountTransactionDTO,
  AccountStatus,
  TransactionType,
  Page,
  PageRequestParams,
} from "@/types";

export interface AccountsFilterParams extends PageRequestParams {
  status?: AccountStatus[];
}

export interface TransactionsFilterParams extends PageRequestParams {
  fromDate?: string;
  toDate?: string;
  type?: TransactionType;
}

export const accountsApi = {
  getAll(params: AccountsFilterParams = {}) {
    return api.get<Page<AccountDTO>>("/api/v1/accounts", { params });
  },

  getById(accountId: string) {
    return api.get<AccountDTO>(`/api/v1/accounts/${accountId}`);
  },

  getUserAccounts(userId: string, params: AccountsFilterParams = {}) {
    return api.get<Page<AccountDTO>>(`/api/v1/accounts/user/${userId}`, {
      params,
    });
  },

  getTransactions(accountId: string, params: TransactionsFilterParams = {}) {
    return api.get<Page<AccountTransactionDTO>>(
      `/api/v1/accounts/${accountId}/transactions`,
      { params }
    );
  },

  delete(accountId: string) {
    return api.delete(`/api/v1/accounts/${accountId}`);
  },
};
