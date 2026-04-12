export type RoleName = "CLIENT" | "EMPLOYEE";
export type Gender = "MALE" | "FEMALE";
export type AccountStatus = "OPEN" | "CLOSED";
export type TransactionType = "INCOME" | "EXPENSE";
export type SortOption = "ASC" | "DESC";
export type PreferenceTheme = "LIGHT" | "DARK";
export type PaymentStatus = "PAID" | "LATE" | "OVERDUE" | "SKIPPED";

export interface UserDTO {
  id: string;
  keycloakUserId?: string | null;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  email: string;
  phone: number | null;
  gender: string;
  roles: RoleName[] | null;
  isBlocked: boolean;
  birthDate: string;
}

export interface AccountDTO {
  id: string;
  userId: string | null;
  name: string | null;
  balance: number;
  status: AccountStatus;
  createdAt: string;
  modifiedAt: string;
}

export interface AccountTransactionDTO {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  createdAt: string;
}

export interface AuthRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserRegisterDTO {
  firstName: string;
  lastName: string;
  patronymic?: string;
  phone?: number;
  gender: Gender;
  email: string;
  password: string;
  birthDate: string;
}

export interface UserEditDTO {
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  phone?: number;
  gender?: Gender;
  email?: string;
  birthDate?: string;
}

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

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export type LoanStatus = "PENDING" | "ACTIVE" | "PAID" | "OVERDUE" | "REJECTED";
export type PaymentType = "ANNUITY";

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

export interface CreateTariffRequest {
  name: string;
  rate: number;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
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

export interface PaymentHistoryResponse {
  paymentId: string;
  loanId: string;
  paymentAmount: number;
  currencyCode: string;
  paymentAmountInLoanCurrency: number;
  loanCurrencyCode: string;
  expectedPaymentDate: string;
  actualPaymentDate: string | null;
  status: PaymentStatus;
  penaltyAmount: number;
}

export interface CreditRatingResponse {
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

export interface UserPreferencesResponse {
  id: string;
  userId: string;
  deviceId: string;
  theme: PreferenceTheme;
  hiddenAccountsIds: string[];
}

export interface UpdatePreferencesRequest {
  theme?: PreferenceTheme;
  hiddenAccountIds?: string[];
}

export type TelemetrySource = "BACKEND" | "FRONTEND";

export interface TelemetrySummaryResponse {
  serviceName: string;
  from: string;
  to: string;
  totalRequests: number;
  errorRequests: number;
  errorRatePercent: number;
  averageDurationMs: number;
  maxDurationMs: number;
}

export interface TelemetryTimelinePointResponse {
  bucketStart: string;
  totalRequests: number;
  errorRequests: number;
  errorRatePercent: number;
  averageDurationMs: number;
  maxDurationMs: number;
}

export interface RecentTelemetryErrorResponse {
  traceId: string;
  serviceName: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  errorMessage: string | null;
  occurredAt: string;
}
