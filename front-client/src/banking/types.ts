/** Реэкспорт банковских DTO для обратной совместимости импортов. */
export type {
  SortOption,
  AccountStatus,
  TransactionType,
  LoanStatus,
  PaymentType,
  CurrencyCode,
  PageRequestParams,
  Page,
  AccountDTO,
  AccountTransactionDTO,
  TariffResponse,
  LoanResponse,
  CreateLoanRequest,
  RepayLoanRequest,
  TransferRequest,
  TransferResult,
} from "../contracts/banking";
