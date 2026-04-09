import { api } from "./client";
import type {
  CreditRatingResponse,
  LoanResponse,
  LoanStatus,
  PaymentHistoryResponse,
  Page,
  PageRequestParams,
} from "@/types";

export interface LoansFilterParams extends PageRequestParams {
  status?: LoanStatus;
}

export type PaymentHistoryFilterParams = PageRequestParams;

export const loansApi = {
  getAll(params: LoansFilterParams = {}) {
    return api.get<Page<LoanResponse>>("/api/v1/loan", { params });
  },

  getById(loanId: string) {
    return api.get<LoanResponse>(`/api/v1/loan/${loanId}`);
  },

  getByUser(userId: string, params: LoansFilterParams = {}) {
    return api.get<Page<LoanResponse>>(`/api/v1/loan/user/${userId}`, {
      params,
    });
  },

  getCreditRatingByUser(userId: string) {
    return api.get<CreditRatingResponse>(`/api/v1/loan/credit-rating/user/${userId}`);
  },

  getOverduePaymentsByUser(
    userId: string,
    params: PaymentHistoryFilterParams = {}
  ) {
    return api.get<Page<PaymentHistoryResponse>>(
      `/api/v1/loan/payments/overdue/user/${userId}`,
      {
        params,
      }
    );
  },

  getOverduePaymentsByLoan(
    loanId: string,
    params: PaymentHistoryFilterParams = {}
  ) {
    return api.get<Page<PaymentHistoryResponse>>(
      `/api/v1/loan/payments/overdue/loan/${loanId}`,
      {
        params,
      }
    );
  },

  approve(loanId: string) {
    return api.patch(`/api/v1/loan/${loanId}/approve`);
  },

  reject(loanId: string) {
    return api.patch(`/api/v1/loan/${loanId}/reject`);
  },
};
