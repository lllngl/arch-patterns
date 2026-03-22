import { create } from "zustand";
import type { UserDTO } from "@/types";
import { authApi } from "@/api/auth";
import { usersApi } from "@/api/users";
import { appEnv } from "@/config/env";
import { AppError } from "@/lib/http-error";
import { hasRole } from "@/lib/roles";
import { finishSsoLogin, startSsoLogin, startSsoLogout } from "@/use-cases/auth/sso";

const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const SSO_PKCE_STORAGE_KEY = "front-employee:sso:pkce";
const SSO_ID_TOKEN_STORAGE_KEY = "front-employee:sso:id-token";

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

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
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
      set({ user: ensureEmployeeAccess(data), isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await authApi.login({ login: email, password });
    setTokens(data.accessToken, data.refreshToken);
    const profile = await usersApi.getMyProfile();
    set({ user: ensureEmployeeAccess(profile.data) });
  },

  loginWithSso: async () => {
    await startSsoLogin();
  },

  completeSsoLogin: async (params) => {
    set({ isLoading: true });
    try {
      await finishSsoLogin(params);
      const profile = await usersApi.getMyProfile();
      set({ user: ensureEmployeeAccess(profile.data), isLoading: false });
    } catch (error) {
      clearTokens();
      set({ user: null, isLoading: false });
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
      set({ user: ensureEmployeeAccess(data) });
    } catch {
      clearTokens();
      set({ user: null });
    }
  },

  clearAuth: () => {
    clearTokens();
    set({ user: null });
  },
}));
