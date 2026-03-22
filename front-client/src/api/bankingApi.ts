import type {
  AccountDTO,
  AccountTransactionDTO,
  CreateLoanRequest,
  LoanResponse,
  LoanStatus,
  MoneyOperationRequest,
  OperationAcceptedResponse,
  Page,
  PageRequestParams,
  RepayLoanRequest,
  TariffResponse,
  TransferRequest,
} from "../contracts/banking";
import {
  accountDtoSchema,
  loanResponseSchema,
  operationAcceptedResponseSchema,
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
  type?: string;
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

  deposit(accountId: string, body: MoneyOperationRequest): Promise<OperationAcceptedResponse> {
    return httpClient.requestJson<OperationAcceptedResponse>(`/api/v1/accounts/${accountId}/deposit`, {
      method: "PATCH",
      body,
      parse: (raw) => operationAcceptedResponseSchema.parse(raw),
    });
  },

  withdraw(accountId: string, body: MoneyOperationRequest): Promise<OperationAcceptedResponse> {
    return httpClient.requestJson<OperationAcceptedResponse>(`/api/v1/accounts/${accountId}/withdraw`, {
      method: "PATCH",
      body,
      parse: (raw) => operationAcceptedResponseSchema.parse(raw),
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

  transfer(payload: TransferRequest): Promise<OperationAcceptedResponse> {
    return httpClient.requestJson<OperationAcceptedResponse>("/api/v1/accounts/transfers", {
      method: "POST",
      body: payload,
      parse: (raw) => operationAcceptedResponseSchema.parse(raw),
    });
  },
};
