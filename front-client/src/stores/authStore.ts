import { create } from "zustand";
import type { UserProfile } from "../contracts/auth";
import type { OAuthCallbackParams } from "../use-cases/auth/oauthLoginUseCase";
import { completeOAuthLoginFromCallbackDeduped } from "../use-cases/auth/oauthCallbackDedup";
import { logoutUser } from "../use-cases/auth/logoutUseCase";
import { restoreSessionIfPossible } from "../use-cases/auth/sessionUseCase";
import { clearOAuthCallbackCache } from "../use-cases/auth/oauthCallbackDedup";

interface AuthStoreState {
  user: UserProfile | null;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  completeOAuthFromCallback: (params: OAuthCallbackParams) => Promise<UserProfile>;
  logout: () => Promise<void>;
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
    const profile = await completeOAuthLoginFromCallbackDeduped(params);
    set({ user: profile });
    return profile;
  },

  logout: async () => {
    clearOAuthCallbackCache();
    await logoutUser();
    set({ user: null });
  },
}));
