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
