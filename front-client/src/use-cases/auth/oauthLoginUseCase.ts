import { oauthApi } from "../../api/oauthApi";
import { tokenStorage } from "../../auth/tokenStorage";
import { createPkceRequest, consumeOAuthState, consumePkceVerifier, peekOAuthState } from "../../oauth/pkce";
import { getOAuthAuthorizationEndpoint, getOAuthClientId, getOAuthRedirectUri } from "../../oauth/oauthConfig";
import type { OAuthTokenRequest } from "../../contracts/oauth";
import type { UserProfile } from "../../contracts/auth";
import { loadUserProfileForClientApp } from "./sessionUseCase";

export async function buildAuthorizationRedirectUrl(): Promise<string> {
  const authorizationEndpoint = getOAuthAuthorizationEndpoint();
  const clientId = getOAuthClientId();
  if (!authorizationEndpoint || !clientId) {
    throw new Error("OAuth не настроен: задайте VITE_OAUTH_AUTHORIZATION_ENDPOINT и VITE_OAUTH_CLIENT_ID.");
  }

  const { codeChallenge, state } = await createPkceRequest();
  const redirectUri = getOAuthRedirectUri();
  const url = new URL(authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid profile email offline_access");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export interface OAuthCallbackParams {
  code: string | null;
  state: string | null;
  error?: string | null;
}

export async function completeOAuthLoginFromCallback(params: OAuthCallbackParams): Promise<UserProfile> {
  if (params.error) {
    throw new Error(`Ошибка авторизации: ${params.error}`);
  }
  if (!params.code || !params.state) {
    throw new Error("Отсутствует code или state в ответе сервиса аутентификации.");
  }

  const expectedState = peekOAuthState();
  if (!expectedState || expectedState !== params.state) {
    throw new Error("Некорректный state (возможная CSRF-атака).");
  }
  consumeOAuthState();

  const codeVerifier = consumePkceVerifier();
  if (!codeVerifier) {
    throw new Error("Отсутствует PKCE code_verifier.");
  }

  const clientId = getOAuthClientId();
  if (!clientId) {
    throw new Error("Не задан VITE_OAUTH_CLIENT_ID.");
  }

  const request: OAuthTokenRequest = {
    grantType: "authorization_code",
    code: params.code,
    redirectUri: getOAuthRedirectUri(),
    codeVerifier,
    clientId,
  };

  const tokens = await oauthApi.exchangeCodeForTokens(request);
  tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
  return loadUserProfileForClientApp();
}
