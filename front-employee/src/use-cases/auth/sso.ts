import axios from "axios";
import { appEnv } from "@/config/env";
import { AppError } from "@/lib/http-error";
import { setTokens } from "@/stores/auth";

const PKCE_STORAGE_KEY = "front-employee:sso:pkce";
const ID_TOKEN_STORAGE_KEY = "front-employee:sso:id-token";

interface PkceSession {
  state: string;
  verifier: string;
  redirectUri: string;
}

interface StartSsoLoginOptions {
  forceAccountSelection?: boolean;
}

function encodeBase64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomString() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return encodeBase64Url(bytes);
}

async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );

  return encodeBase64Url(new Uint8Array(digest));
}

function getRedirectUri() {
  return appEnv.ssoRedirectUri;
}

function savePkceSession(session: PkceSession) {
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(session));
}

function readPkceSession(): PkceSession | null {
  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PkceSession;
  } catch {
    return null;
  }
}

function clearPkceSession() {
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
}

function saveIdToken(idToken: string | null | undefined) {
  if (!idToken) {
    sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, idToken);
}

function readIdToken() {
  return sessionStorage.getItem(ID_TOKEN_STORAGE_KEY);
}

export function clearSsoSessionArtifacts() {
  clearPkceSession();
  sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
}

function ensureSsoConfiguration() {
  if (!appEnv.ssoEnabled) {
    throw new AppError(
      "SSO не включён для front-employee. Нужна настройка Keycloak и переменных окружения."
    );
  }

  if (!appEnv.ssoAuthorizeUrl || !appEnv.ssoTokenUrl || !appEnv.ssoClientId) {
    throw new AppError(
      "SSO не настроен: отсутствуют authorize/token URL или client id."
    );
  }
}

export async function startSsoLogin(options?: StartSsoLoginOptions) {
  ensureSsoConfiguration();

  const verifier = randomString();
  const challenge = await createCodeChallenge(verifier);
  const state = randomString();
  const redirectUri = getRedirectUri();

  savePkceSession({ state, verifier, redirectUri });

  const authorizeUrl = new URL(appEnv.ssoAuthorizeUrl!);
  authorizeUrl.searchParams.set("client_id", appEnv.ssoClientId!);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "openid profile offline_access");
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);
  if (options?.forceAccountSelection) {
    authorizeUrl.searchParams.set("prompt", "login");
  }

  window.location.assign(authorizeUrl.toString());
}

export async function finishSsoLogin(params: URLSearchParams) {
  ensureSsoConfiguration();

  const session = readPkceSession();
  if (!session) {
    throw new AppError(
      "Сессия входа не найдена. Повторите вход через auth-сервис."
    );
  }

  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    clearSsoSessionArtifacts();
    throw new AppError(`Auth-сервис отклонил вход: ${error}`);
  }

  if (!code || !state) {
    throw new AppError(
      "Auth callback не содержит code/state. Нужен совместимый OIDC/OAuth callback."
    );
  }

  if (state !== session.state) {
    clearSsoSessionArtifacts();
    throw new AppError("Проверка SSO state не прошла.");
  }

  const payload = new URLSearchParams();
  payload.set("grant_type", "authorization_code");
  payload.set("client_id", appEnv.ssoClientId!);
  payload.set("code", code);
  payload.set("code_verifier", session.verifier);
  payload.set("redirect_uri", session.redirectUri);

  const { data } = await axios.post<{
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    accessToken?: string;
    refreshToken?: string;
  }>(appEnv.ssoTokenUrl!, payload, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const accessToken = data.access_token ?? data.accessToken;
  const refreshToken = data.refresh_token ?? data.refreshToken;

  if (!accessToken || !refreshToken) {
    throw new AppError(
      "Auth-сервис не вернул access/refresh token в ожидаемом формате."
    );
  }

  setTokens(accessToken, refreshToken);
  saveIdToken(data.id_token);
  clearPkceSession();
}

export function startSsoLogout() {
  ensureSsoConfiguration();

  const logoutUrl = new URL(appEnv.ssoLogoutUrl!);
  logoutUrl.searchParams.set("client_id", appEnv.ssoClientId!);
  logoutUrl.searchParams.set(
    "post_logout_redirect_uri",
    appEnv.ssoPostLogoutRedirectUri
  );

  const idToken = readIdToken();
  if (idToken) {
    logoutUrl.searchParams.set("id_token_hint", idToken);
  }

  clearSsoSessionArtifacts();
  window.location.assign(logoutUrl.toString());
}

export function buildSsoBlockerReason() {
  if (!appEnv.ssoEnabled) {
    return "SSO выключен в конфигурации `front-employee`.";
  }

  if (!appEnv.ssoClientId) {
    return "Не настроен `VITE_AUTH_SSO_CLIENT_ID`.";
  }

  return null;
}
