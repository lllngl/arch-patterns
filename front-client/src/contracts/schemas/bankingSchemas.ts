import { z } from "zod";

const currencyCode = z.enum(["RUB", "USD", "EUR"]);

export const tariffResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  rate: z.number(),
  minAmount: z.number(),
  maxAmount: z.number(),
  minTermMonths: z.number(),
  maxTermMonths: z.number(),
  active: z.boolean(),
});

export const accountDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  balance: z.number(),
  currency: currencyCode,
  status: z.enum(["OPEN", "CLOSED"]),
  type: z.string(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

export const accountTransactionDtoSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  amount: z.number(),
  operationAmount: z.number().nullable(),
  type: z.string(),
  description: z.string().nullable(),
  operationCurrency: currencyCode.nullable(),
  accountCurrency: currencyCode.nullable(),
  bankCurrency: currencyCode.nullable(),
  exchangeRate: z.number().nullable(),
  commissionAmount: z.number().nullable(),
  commissionCurrency: currencyCode.nullable(),
  relatedAccountId: z.string().nullable(),
  createdAt: z.string(),
});

export const operationAcceptedResponseSchema = z.object({
  operationRequestId: z.string(),
  status: z.string(),
  message: z.string(),
  submittedAt: z.string(),
});

export const loanResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  accountId: z.string(),
  amount: z.number(),
  termMonths: z.number(),
  status: z.enum(["PENDING", "ACTIVE", "PAID", "OVERDUE", "REJECTED"]),
  paymentType: z.enum(["ANNUITY"]),
  monthlyPayment: z.number(),
  remainingAmount: z.number(),
  nextPaymentDate: z.string().nullable(),
  paymentDate: z.string().nullable(),
  createdAt: z.string(),
  tariff: tariffResponseSchema,
});

const pageFields = {
  totalPages: z.number(),
  totalElements: z.number(),
  size: z.number(),
  number: z.number(),
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean(),
};

export const pageAccountSchema = z.object({
  content: z.array(accountDtoSchema),
  ...pageFields,
});

export const pageTransactionSchema = z.object({
  content: z.array(accountTransactionDtoSchema),
  ...pageFields,
});

export const pageLoanSchema = z.object({
  content: z.array(loanResponseSchema),
  ...pageFields,
});

export const pageTariffSchema = z.object({
  content: z.array(tariffResponseSchema),
  ...pageFields,
});
