import type { AuthRequest, AuthResponse, UserProfile } from "../contracts/auth";
import { authResponseSchema, userProfileSchema } from "../contracts/schemas/authSchemas";
import { httpClient } from "../network/httpClientSingleton";

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
