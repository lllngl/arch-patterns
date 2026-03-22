export type UserRole = "CLIENT" | "EMPLOYEE";

export interface AuthRequest {
  login: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  email: string;
  phone: number | null;
  gender: string | null;
  roles: UserRole[];
  isBlocked: boolean;
  birthDate: string | null;
}
