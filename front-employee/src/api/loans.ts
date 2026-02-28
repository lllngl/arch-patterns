import { api } from "./client";
import type {
  LoanResponse,
  LoanStatus,
  Page,
  PageRequestParams,
} from "@/types";

export interface LoansFilterParams extends PageRequestParams {
  status?: LoanStatus;
}

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

  approve(loanId: string) {
    return api.patch(`/api/v1/loan/${loanId}/approve`);
  },

  reject(loanId: string) {
    return api.patch(`/api/v1/loan/${loanId}/reject`);
  },
};
