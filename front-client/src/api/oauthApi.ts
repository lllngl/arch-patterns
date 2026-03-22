import type { AuthResponse } from "../contracts/auth";
import { authResponseSchema } from "../contracts/schemas/authSchemas";
import type { OAuthTokenRequest } from "../contracts/oauth";
import { httpClient } from "../network/httpClientSingleton";

/**
 * Обмен authorization code на токены (RFC 6749). Реальный вызов — на BFF/AS.
 */
export const oauthApi = {
  async exchangeCodeForTokens(request: OAuthTokenRequest): Promise<AuthResponse> {
    const stub = import.meta.env.VITE_OAUTH_STUB === "true";
    if (stub) {
      // eslint-disable-next-line no-console -- явная диагностика заглушки
      console.warn("[oauthApi] VITE_OAUTH_STUB: токены не получены с сервера; требуется настроенный IdP/BFF.");
      throw new Error("OAuth stub: настройте BFF или отключите VITE_OAUTH_STUB.");
    }

    const tokenEndpoint = import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT as string | undefined;
    if (!tokenEndpoint) {
      throw new Error("Не задан VITE_OAUTH_TOKEN_ENDPOINT для обмена кода на токены.");
    }

    return httpClient.requestJson<AuthResponse>(tokenEndpoint, {
      method: "POST",
      requiresAuth: false,
      body: {
        grant_type: request.grantType,
        code: request.code,
        redirect_uri: request.redirectUri,
        code_verifier: request.codeVerifier,
        client_id: request.clientId,
      },
      parse: (raw) => authResponseSchema.parse(raw),
    });
  },
};
