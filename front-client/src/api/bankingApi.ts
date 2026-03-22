import type {
  AccountDTO,
  AccountTransactionDTO,
  CreateLoanRequest,
  LoanResponse,
  LoanStatus,
  Page,
  PageRequestParams,
  RepayLoanRequest,
  TariffResponse,
  TransactionType,
  TransferRequest,
  TransferResult,
} from "../contracts/banking";
import {
  accountDtoSchema,
  loanResponseSchema,
  pageAccountSchema,
  pageLoanSchema,
  pageTariffSchema,
  pageTransactionSchema,
} from "../contracts/schemas/bankingSchemas";
import { httpClient } from "../network/httpClientSingleton";

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
  getUserAccounts(userId: string, params: PageRequestParams = {}): Promise<Page<AccountDTO>> {
    const query = buildQuery({
      page: params.page ?? 0,
      size: params.size ?? 20,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "DESC",
    });
    return httpClient.requestJson<Page<AccountDTO>>(`/api/v1/accounts/user/${userId}${query}`, {
      parse: (raw) => pageAccountSchema.parse(raw),
    });
  },

  createAccount(userId: string, name: string): Promise<AccountDTO> {
    return httpClient.requestJson<AccountDTO>(`/api/v1/accounts/${userId}`, {
      method: "POST",
      body: { name },
      parse: (raw) => accountDtoSchema.parse(raw),
    });
  },

  closeAccount(accountId: string): Promise<void> {
    return httpClient.requestJson<void>(`/api/v1/accounts/${accountId}/close`, {
      method: "PATCH",
    });
  },

  deposit(accountId: string, amount: number): Promise<AccountDTO> {
    return httpClient.requestJson<AccountDTO>(`/api/v1/accounts/${accountId}/deposit`, {
      method: "PATCH",
      body: { amount },
      parse: (raw) => accountDtoSchema.parse(raw),
    });
  },

  withdraw(accountId: string, amount: number): Promise<AccountDTO> {
    return httpClient.requestJson<AccountDTO>(`/api/v1/accounts/${accountId}/withdraw`, {
      method: "PATCH",
      body: { amount },
      parse: (raw) => accountDtoSchema.parse(raw),
    });
  },

  getTransactions(accountId: string, params: TransactionsParams = {}): Promise<Page<AccountTransactionDTO>> {
    const query = buildQuery({
      page: params.page ?? 0,
      size: params.size ?? 20,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "DESC",
      type: params.type,
    });
    return httpClient.requestJson<Page<AccountTransactionDTO>>(`/api/v1/accounts/${accountId}/transactions${query}`, {
      parse: (raw) => pageTransactionSchema.parse(raw),
    });
  },

  getMyLoans(params: PageRequestParams = {}, status?: LoanStatus): Promise<Page<LoanResponse>> {
    const query = buildQuery({
      page: params.page ?? 0,
      size: params.size ?? 20,
      sortBy: params.sortBy ?? "createdAt",
      sortDir: params.sortDir ?? "DESC",
      status,
    });
    return httpClient.requestJson<Page<LoanResponse>>(`/api/v1/loan/my${query}`, {
      parse: (raw) => pageLoanSchema.parse(raw),
    });
  },

  getTariffs(params: PageRequestParams = {}): Promise<Page<TariffResponse>> {
    const query = buildQuery({
      page: params.page ?? 0,
      size: params.size ?? 50,
      sortBy: params.sortBy ?? "name",
      sortDir: params.sortDir ?? "ASC",
      active: true,
    });
    return httpClient.requestJson<Page<TariffResponse>>(`/api/v1/tariffs${query}`, {
      parse: (raw) => pageTariffSchema.parse(raw),
    });
  },

  createLoan(payload: CreateLoanRequest): Promise<LoanResponse> {
    return httpClient.requestJson<LoanResponse>("/api/v1/loan", {
      method: "POST",
      body: payload,
      parse: (raw) => loanResponseSchema.parse(raw),
    });
  },

  repayLoan(loanId: string, payload: RepayLoanRequest): Promise<LoanResponse> {
    return httpClient.requestJson<LoanResponse>(`/api/v1/loan/${loanId}/repay`, {
      method: "POST",
      body: payload,
      parse: (raw) => loanResponseSchema.parse(raw),
    });
  },

  /**
   * Перевод между счетами (заглушка до появления эндпоинта на бэке).
   */
  transfer: async (_payload: TransferRequest): Promise<TransferResult> => {
    const endpoint = import.meta.env.VITE_TRANSFER_ENDPOINT as string | undefined;
    if (!endpoint) {
      return Promise.reject(new Error("Переводы: эндпоинт не настроен (VITE_TRANSFER_ENDPOINT)."));
    }
    return httpClient.requestJson<TransferResult>(endpoint, {
      method: "POST",
      body: _payload,
    });
  },
};
