/**
 * Просроченные платежи и кредитный рейтинг — заглушки контрактов до появления API.
 */
export interface OverduePaymentDTO {
  loanId: string;
  dueDate: string;
  amount: number;
  currency: string;
}

export interface CreditRatingDTO {
  userId: string;
  /** 0–100, чем выше — тем лучше прогноз возврата. */
  score: number;
  label: string;
  computedAt: string;
}
