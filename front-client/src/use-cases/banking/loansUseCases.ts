import { bankingApi } from "../../api/bankingApi";
import type { CreateLoanRequest, LoanStatus, PageRequestParams, RepayLoanRequest } from "../../contracts/banking";

export async function fetchTariffsPage(params: PageRequestParams) {
  return bankingApi.getTariffs(params);
}

export async function fetchMyLoansPage(params: PageRequestParams, status?: LoanStatus) {
  return bankingApi.getMyLoans(params, status);
}

export async function createLoanRequest(payload: CreateLoanRequest) {
  return bankingApi.createLoan(payload);
}

export async function repayLoanRequest(loanId: string, payload: RepayLoanRequest) {
  return bankingApi.repayLoan(loanId, payload);
}
