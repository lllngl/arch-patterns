import type { AuthRequest, AuthResponse } from "@/types";
import { httpClient } from "@/network/http";

export const authApi = {
  login(data: AuthRequest) {
    return httpClient.post<AuthResponse>("/api/v1/auth/authenticate", data, {
      __skipRetry: true,
      __skipCircuitBreaker: true,
    });
  },

  refresh(refreshToken: string) {
    return httpClient.post<AuthResponse>(
      "/api/v1/auth/refresh",
      { refreshToken },
      {
        __skipRetry: true,
        __skipCircuitBreaker: true,
      }
    );
  },

  logout(refreshToken: string) {
    return httpClient.post(
      "/api/v1/auth/logout",
      { refreshToken },
      {
        __skipRetry: true,
        __skipCircuitBreaker: true,
      }
    );
  },
};
