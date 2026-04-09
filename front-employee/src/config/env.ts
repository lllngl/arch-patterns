const env = import.meta.env;
const DEFAULT_KEYCLOAK_BASE_URL = "http://localhost:8081";
const DEFAULT_KEYCLOAK_REALM = "internetbank";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getOptionalEnv(name: string): string | null {
  const value = env[name];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getBooleanEnv(name: string): boolean {
  return env[name] === "true";
}

function getEnvWithDefault(name: string, fallback: string): string {
  return getOptionalEnv(name) ?? fallback;
}

const keycloakBaseUrl = trimTrailingSlash(
  getEnvWithDefault("VITE_KEYCLOAK_BASE_URL", DEFAULT_KEYCLOAK_BASE_URL)
);
const keycloakRealm = getEnvWithDefault(
  "VITE_KEYCLOAK_REALM",
  DEFAULT_KEYCLOAK_REALM
);
const keycloakRealmUrl = `${keycloakBaseUrl}/realms/${keycloakRealm}`;
const defaultRedirectUri = `${window.location.origin}/auth/callback`;
const defaultPostLogoutRedirectUri = `${window.location.origin}/login`;

export const appEnv = {
  ssoEnabled: getBooleanEnv("VITE_AUTH_SSO_ENABLED"),
  allowLegacyPasswordLogin: getBooleanEnv("VITE_AUTH_ENABLE_LEGACY_LOGIN"),
  keycloakBaseUrl,
  keycloakRealm,
  keycloakRealmUrl,
  ssoClientId: getEnvWithDefault("VITE_AUTH_SSO_CLIENT_ID", "front-employee"),
  ssoAuthorizeUrl:
    getOptionalEnv("VITE_AUTH_SSO_AUTHORIZE_URL") ??
    `${keycloakRealmUrl}/protocol/openid-connect/auth`,
  ssoTokenUrl:
    getOptionalEnv("VITE_AUTH_SSO_TOKEN_URL") ??
    `${keycloakRealmUrl}/protocol/openid-connect/token`,
  ssoLogoutUrl:
    getOptionalEnv("VITE_AUTH_SSO_LOGOUT_URL") ??
    `${keycloakRealmUrl}/protocol/openid-connect/logout`,
  ssoRedirectUri:
    getOptionalEnv("VITE_AUTH_SSO_REDIRECT_URI") ?? defaultRedirectUri,
  ssoPostLogoutRedirectUri:
    getOptionalEnv("VITE_AUTH_SSO_POST_LOGOUT_REDIRECT_URI") ??
    defaultPostLogoutRedirectUri,
  transactionsWsUrl:
    getOptionalEnv("VITE_EMPLOYEE_TRANSACTIONS_WS_URL") ?? "/ws",
};
