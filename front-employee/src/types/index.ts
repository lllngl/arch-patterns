export type RoleName = "CLIENT" | "EMPLOYEE";
export type Gender = "MALE" | "FEMALE";
export type AccountStatus = "OPEN" | "CLOSED";
export type TransactionType = "INCOME" | "EXPENSE";
export type SortOption = "ASC" | "DESC";

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  email: string;
  phone: number | null;
  gender: string;
  role: RoleName;
  isBlocked: boolean;
  birthDate: string;
}

export interface AccountDTO {
  id: string;
  userId: string;
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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmationPassword: string;
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
