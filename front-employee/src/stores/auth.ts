import { create } from "zustand";
import type { UserDTO } from "@/types";
import { authApi } from "@/api/auth";
import { usersApi } from "@/api/users";
import { appEnv } from "@/config/env";
import { AppError, toAppError } from "@/lib/http-error";
import { hasRole } from "@/lib/roles";
import { finishSsoLogin, startSsoLogin, startSsoLogout } from "@/use-cases/auth/sso";

const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const SSO_PKCE_STORAGE_KEY = "front-employee:sso:pkce";
const SSO_ID_TOKEN_STORAGE_KEY = "front-employee:sso:id-token";
const USER_CACHE_KEY = "front-employee:auth:user";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

function cacheUser(user: UserDTO) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

function readCachedUser(): UserDTO | null {
  const raw = localStorage.getItem(USER_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserDTO;
  } catch {
    localStorage.removeItem(USER_CACHE_KEY);
    return null;
  }
}

function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(normalized);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildUserFromToken(accessToken: string): UserDTO | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return null;
  }

  const realmAccess = payload.realm_access as
    | { roles?: unknown[] }
    | undefined;
  const roles = Array.isArray(realmAccess?.roles)
    ? realmAccess.roles.filter(
        (role): role is "CLIENT" | "EMPLOYEE" =>
          role === "CLIENT" || role === "EMPLOYEE"
      )
    : [];

  const userId =
    typeof payload.user_id === "string"
      ? payload.user_id
      : typeof payload.sub === "string"
        ? payload.sub
        : null;

  if (!userId || !roles.length) {
    return null;
  }

  return {
    id: userId,
    keycloakUserId: typeof payload.sub === "string" ? payload.sub : null,
    firstName: typeof payload.given_name === "string" ? payload.given_name : "",
    lastName: typeof payload.family_name === "string" ? payload.family_name : "",
    patronymic: null,
    email: typeof payload.email === "string" ? payload.email : "",
    phone: null,
    gender: "",
    roles,
    isBlocked: false,
    birthDate: "",
  };
}

function isAuthFailure(error: unknown) {
  const appError = toAppError(error);
  return appError.status === 401 || appError.status === 403;
}

function resolveFallbackUser() {
  const cachedUser = readCachedUser();
  if (cachedUser && hasRole(cachedUser, "EMPLOYEE")) {
    return cachedUser;
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  const tokenUser = buildUserFromToken(accessToken);
  return tokenUser && hasRole(tokenUser, "EMPLOYEE") ? tokenUser : null;
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_CACHE_KEY);
  sessionStorage.removeItem(SSO_PKCE_STORAGE_KEY);
  sessionStorage.removeItem(SSO_ID_TOKEN_STORAGE_KEY);
}

function ensureEmployeeAccess(user: UserDTO) {
  if (!hasRole(user, "EMPLOYEE")) {
    throw new AppError(
      "Учётная запись вошла через SSO, но не имеет роли EMPLOYEE для приложения сотрудника."
    );
  }

  return user;
}

interface AuthState {
  user: UserDTO | null;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithSso: () => Promise<void>;
  loginWithSsoAsDifferentUser: () => Promise<void>;
  completeSsoLogin: (params: URLSearchParams) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,

  initialize: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await usersApi.getMyProfile();
      const user = ensureEmployeeAccess(data);
      cacheUser(user);
      set({ user, isLoading: false });
    } catch (error) {
      if (isAuthFailure(error) || error instanceof AppError) {
        clearTokens();
        set({ user: null, isLoading: false });
        return;
      }

      set({ user: resolveFallbackUser(), isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await authApi.login({ login: email, password });
    setTokens(data.accessToken, data.refreshToken);
    try {
      const profile = await usersApi.getMyProfile();
      const user = ensureEmployeeAccess(profile.data);
      cacheUser(user);
      set({ user });
    } catch (error) {
      if (isAuthFailure(error) || error instanceof AppError) {
        clearTokens();
      }

      throw error;
    }
  },

  loginWithSso: async () => {
    await startSsoLogin();
  },

  loginWithSsoAsDifferentUser: async () => {
    await startSsoLogin({ forceAccountSelection: true });
  },

  completeSsoLogin: async (params) => {
    set({ isLoading: true });
    try {
      await finishSsoLogin(params);
      const profile = await usersApi.getMyProfile();
      const user = ensureEmployeeAccess(profile.data);
      cacheUser(user);
      set({ user, isLoading: false });
    } catch (error) {
      if (isAuthFailure(error) || error instanceof AppError) {
        clearTokens();
        set({ user: null, isLoading: false });
      } else {
        set({ user: resolveFallbackUser(), isLoading: false });
      }
      throw error;
    }
  },

  logout: async () => {
    const refresh = getRefreshToken();
    clearTokens();
    set({ user: null });

    if (appEnv.ssoEnabled) {
      startSsoLogout();
      return;
    }

    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        //
      }
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await usersApi.getMyProfile();
      const user = ensureEmployeeAccess(data);
      cacheUser(user);
      set({ user });
    } catch (error) {
      if (isAuthFailure(error) || error instanceof AppError) {
        clearTokens();
        set({ user: null });
        return;
      }

      const fallbackUser = resolveFallbackUser();
      if (fallbackUser) {
        set({ user: fallbackUser });
      }
    }
  },

  clearAuth: () => {
    clearTokens();
    set({ user: null });
  },
}));
