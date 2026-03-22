export interface PaymentHistoryDTO {
  paymentId: string;
  loanId: string;
  paymentAmount: number;
  currencyCode: string;
  paymentAmountInLoanCurrency: number;
  loanCurrencyCode: string;
  expectedPaymentDate: string;
  actualPaymentDate: string | null;
  status: string;
  penaltyAmount: number;
}

export interface CreditRatingDTO {
  score: number;
  grade: string;
  totalLoans: number;
  activeLoans: number;
  paidLoans: number;
  overdueCount: number;
  totalPenalties: number;
  totalOverdueAmount: number;
  lastOverdueDate: string | null;
  creditUtilization: number;
  isEligibleForNewLoan: boolean;
}
