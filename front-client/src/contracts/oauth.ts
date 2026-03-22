/**
 * OAuth 2.0 Authorization Code + PKCE (рекомендуемый поток для SPA).
 * Обмен кода на токены выполняется через BFF/сервис аутентификации (не на стороне UI с паролем).
 */
export interface OAuthTokenRequest {
  grantType: "authorization_code";
  code: string;
  redirectUri: string;
  codeVerifier: string;
  clientId: string;
}

export interface OAuthConfig {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}
