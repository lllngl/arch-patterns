import { create } from "zustand";
import type { UserProfile } from "../contracts/auth";
import { completeOAuthLoginFromCallback, type OAuthCallbackParams } from "../use-cases/auth/oauthLoginUseCase";
import { logoutUser } from "../use-cases/auth/logoutUseCase";
import { restoreSessionIfPossible } from "../use-cases/auth/sessionUseCase";
import { loginWithPasswordForDev } from "../use-cases/auth/legacyLoginUseCase";

interface AuthStoreState {
  user: UserProfile | null;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  completeOAuthFromCallback: (params: OAuthCallbackParams) => Promise<UserProfile>;
  logout: () => Promise<void>;
  /** Только при VITE_ENABLE_LEGACY_PASSWORD_LOGIN */
  loginWithLegacyPassword: (login: string, password: string) => Promise<UserProfile>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isInitializing: true,

  setUser: (user) => set({ user }),

  initialize: async () => {
    set({ isInitializing: true });
    try {
      const profile = await restoreSessionIfPossible();
      set({ user: profile });
    } finally {
      set({ isInitializing: false });
    }
  },

  refreshUser: async () => {
    const profile = await restoreSessionIfPossible();
    set({ user: profile });
  },

  completeOAuthFromCallback: async (params) => {
    const profile = await completeOAuthLoginFromCallback(params);
    set({ user: profile });
    return profile;
  },

  logout: async () => {
    await logoutUser();
    set({ user: null });
  },

  loginWithLegacyPassword: async (login, password) => {
    const profile = await loginWithPasswordForDev(login, password);
    set({ user: profile });
    return profile;
  },
}));
