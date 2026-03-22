import { z } from "zod";

export const paymentHistoryResponseSchema = z
  .object({
    paymentId: z.string(),
    loanId: z.string(),
    paymentAmount: z.number(),
    currencyCode: z.string(),
    paymentAmountInLoanCurrency: z.number(),
    loanCurrencyCode: z.string(),
    expectedPaymentDate: z.string(),
    actualPaymentDate: z.string().nullable(),
    status: z.string(),
    penaltyAmount: z.number(),
  })
  .strict();

export const pagePaymentHistorySchema = z.object({
  content: z.array(paymentHistoryResponseSchema),
  totalPages: z.number(),
  totalElements: z.number(),
  size: z.number(),
  number: z.number(),
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean(),
});

export const creditRatingResponseSchema = z.object({
  score: z.number(),
  grade: z.string(),
  totalLoans: z.number(),
  activeLoans: z.number(),
  paidLoans: z.number(),
  overdueCount: z.number(),
  totalPenalties: z.number(),
  totalOverdueAmount: z.number(),
  lastOverdueDate: z.string().nullable(),
  creditUtilization: z.number(),
  isEligibleForNewLoan: z.boolean(),
});
