import type { AuthRequest, AuthResponse, UserProfile } from "../contracts/auth";
import { authResponseSchema, userProfileSchema } from "../contracts/schemas/authSchemas";
import { httpClient } from "../network/httpClientSingleton";

/**
 * API-слой: бизнес-операции аутентификации и типизированный разбор ответов.
 * Пароль не должен вводиться в UI клиента — метод login оставлен для совместимости с BFF/отладкой.
 */
export const authApi = {
  login(data: AuthRequest): Promise<AuthResponse> {
    return httpClient.requestJson<AuthResponse>("/api/v1/auth/authenticate", {
      method: "POST",
      requiresAuth: false,
      body: data,
      parse: (raw) => authResponseSchema.parse(raw),
    });
  },

  logout(refreshToken: string): Promise<void> {
    return httpClient.requestJson<void>("/api/v1/auth/logout", {
      method: "POST",
      requiresAuth: false,
      body: { refreshToken },
    });
  },

  getMyProfile(): Promise<UserProfile> {
    return httpClient.requestJson<UserProfile>("/api/v1/users/profile", {
      parse: (raw) => userProfileSchema.parse(raw),
    });
  },
};
