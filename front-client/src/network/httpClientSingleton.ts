import { tokenStorage } from "../auth/tokenStorage";
import { authResponseSchema } from "../contracts/schemas/authSchemas";
import type { AuthResponse } from "../contracts/auth";
import { HttpClient } from "./httpClient";

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clearTokens();
    return null;
  }

  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      tokenStorage.clearTokens();
      return null;
    }

    const raw: unknown = await response.json();
    const data = authResponseSchema.parse(raw) as AuthResponse;
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

export const httpClient = new HttpClient({
  getAccessToken: () => tokenStorage.getAccessToken(),
  getRefreshToken: () => tokenStorage.getRefreshToken(),
  setTokens: (accessToken, refreshToken) => tokenStorage.setTokens(accessToken, refreshToken),
  clearTokens: () => tokenStorage.clearTokens(),
  refreshAccessToken,
});
