export interface OverduePaymentDTO {
  loanId: string;
  dueDate: string;
  amount: number;
  currency: string;
}

export interface CreditRatingDTO {
  userId: string;
  score: number;
  label: string;
  computedAt: string;
}
