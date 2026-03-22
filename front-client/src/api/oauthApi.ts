import type { AuthResponse } from "../contracts/auth";
import type { OAuthTokenRequest } from "../contracts/oauth";

export const oauthApi = {
  async exchangeCodeForTokens(request: OAuthTokenRequest): Promise<AuthResponse> {
    const stub = import.meta.env.VITE_OAUTH_STUB === "true";
    if (stub) {
      // eslint-disable-next-line no-console
      console.warn("[oauthApi] VITE_OAUTH_STUB: токены не получены с сервера; требуется настроенный IdP/BFF.");
      throw new Error("OAuth stub: настройте BFF или отключите VITE_OAUTH_STUB.");
    }

    const tokenEndpoint = import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT as string | undefined;
    if (!tokenEndpoint) {
      throw new Error("Не задан VITE_OAUTH_TOKEN_ENDPOINT для обмена кода на токены.");
    }

    const params = new URLSearchParams();
    params.set("grant_type", request.grantType);
    params.set("code", request.code);
    params.set("redirect_uri", request.redirectUri);
    params.set("code_verifier", request.codeVerifier);
    params.set("client_id", request.clientId);

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Token endpoint failed: ${response.status}`);
    }

    const raw: unknown = await response.json();
    const rec = raw as Record<string, unknown>;
    if (typeof rec.access_token !== "string" || typeof rec.refresh_token !== "string") {
      throw new Error("Ответ token endpoint без access_token/refresh_token.");
    }
    return {
      accessToken: rec.access_token,
      refreshToken: rec.refresh_token,
    };
  },
};
