import { create } from "zustand";
import type { UserDTO } from "@/types";
import { authApi } from "@/api/auth";
import { usersApi } from "@/api/users";

const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

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
}

interface AuthState {
  user: UserDTO | null;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
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
      set({ user: data, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await authApi.login({ login: email, password });
    setTokens(data.accessToken, data.refreshToken);
    const profile = await usersApi.getMyProfile();
    set({ user: profile.data });
  },

  logout: async () => {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        //
      }
    }
    clearTokens();
    set({ user: null });
  },

  fetchUser: async () => {
    try {
      const { data } = await usersApi.getMyProfile();
      set({ user: data });
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
