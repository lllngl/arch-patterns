export type SortOption = "ASC" | "DESC";
export type AccountStatus = "OPEN" | "CLOSED";
export type LoanStatus = "PENDING" | "ACTIVE" | "PAID" | "OVERDUE" | "REJECTED";
export type PaymentType = "ANNUITY";

export type CurrencyCode = "RUB" | "USD" | "EUR";

export type LedgerTransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "MASTER_IN"
  | "MASTER_OUT";

export interface PageRequestParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: SortOption;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AccountDTO {
  id: string;
  userId: string;
  name: string | null;
  balance: number;
  currency: CurrencyCode;
  status: AccountStatus;
  type: string;
  createdAt: string;
  modifiedAt: string;
}

export interface AccountTransactionDTO {
  id: string;
  accountId: string;
  amount: number;
  operationAmount: number | null;
  type: LedgerTransactionType | string;
  description: string | null;
  operationCurrency: CurrencyCode | null;
  accountCurrency: CurrencyCode | null;
  bankCurrency: CurrencyCode | null;
  exchangeRate: number | null;
  commissionAmount: number | null;
  commissionCurrency: CurrencyCode | null;
  relatedAccountId: string | null;
  createdAt: string;
}

export interface TariffResponse {
  id: string;
  name: string;
  rate: number;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  active: boolean;
}

export interface LoanResponse {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  termMonths: number;
  status: LoanStatus;
  paymentType: PaymentType;
  monthlyPayment: number;
  remainingAmount: number;
  nextPaymentDate: string | null;
  paymentDate: string | null;
  createdAt: string;
  tariff: TariffResponse;
}

export interface CreateLoanRequest {
  userId: string;
  accountId: string;
  amount: number;
  termMonths: number;
  tariffId: string;
  paymentType: PaymentType;
}

export interface RepayLoanRequest {
  userId: string;
  accountId: string;
  amount: number;
}

export interface MoneyOperationRequest {
  amount: number;
  operationCurrency?: CurrencyCode | null;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  operationCurrency?: CurrencyCode | null;
}

export interface OperationAcceptedResponse {
  operationRequestId: string;
  status: string;
  message: string;
  submittedAt: string;
}
