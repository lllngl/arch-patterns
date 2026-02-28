import { apiRequest } from "../auth/api";
import type {
  AccountDTO,
  AccountTransactionDTO,
  CreateLoanRequest,
  LoanResponse,
  Page,
  PageRequestParams,
  RepayLoanRequest,
  TariffResponse,
  TransactionType,
} from "./types";

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

interface TransactionsParams extends PageRequestParams {
  type?: TransactionType;
}

export const bankingApi = {
  getUserAccounts(userId: string, params: PageRequestParams = {}) {
    const query = buildQuery({
      page: params.page ?? 0,
      size: params.size ?? 20,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "DESC",
    });
    return apiRequest<Page<AccountDTO>>(`/api/v1/accounts/user/${userId}${query}`);
  },

  createAccount(userId: string, name: string) {
    return apiRequest<AccountDTO>(`/api/v1/accounts/${userId}`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  closeAccount(accountId: string) {
    return apiRequest<void>(`/api/v1/accounts/${accountId}/close`, {
      method: "PATCH",
    });
  },

  deposit(accountId: string, amount: number) {
    return apiRequest<AccountDTO>(`/api/v1/accounts/${accountId}/deposit`, {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    });
  },

  withdraw(accountId: string, amount: number) {
    return apiRequest<AccountDTO>(`/api/v1/accounts/${accountId}/withdraw`, {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    });
  },

  getTransactions(accountId: string, params: TransactionsParams = {}) {
    const query = buildQuery({
      page: params.page ?? 0,
      size: params.size ?? 20,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "DESC",
      type: params.type,
    });
    return apiRequest<Page<AccountTransactionDTO>>(`/api/v1/accounts/${accountId}/transactions${query}`);
  },

  getMyLoans(params: PageRequestParams = {}) {
    const query = buildQuery({
      page: params.page ?? 0,
      size: params.size ?? 20,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "DESC",
    });
    return apiRequest<Page<LoanResponse>>(`/api/v1/loan/my${query}`);
  },

  getTariffs(params: PageRequestParams = {}) {
    const query = buildQuery({
      page: params.page ?? 0,
      size: params.size ?? 50,
      sortBy: params.sortBy ?? "name",
      sortDir: params.sortDir ?? "ASC",
      active: true,
    });
    return apiRequest<Page<TariffResponse>>(`/api/v1/tariffs${query}`);
  },

  createLoan(payload: CreateLoanRequest) {
    return apiRequest<LoanResponse>("/api/v1/loan", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  repayLoan(loanId: string, payload: RepayLoanRequest) {
    return apiRequest<LoanResponse>(`/api/v1/loan/${loanId}/repay`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
