import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, ApiError } from "./api";
import { tokenStorage } from "./tokenStorage";
import type { UserProfile } from "./types";

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshUser = useCallback(async () => {
    const profile = await authApi.getMyProfile();
    if (profile.role !== "CLIENT") {
      tokenStorage.clearTokens();
      setUser(null);
      throw new ApiError(403, "This application is available only for clients");
    }
    setUser(profile);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ login: email, password });
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        //
      }
    }
    tokenStorage.clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        setIsInitializing(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        tokenStorage.clearTokens();
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    void initialize();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      logout,
      refreshUser,
    }),
    [isInitializing, login, logout, refreshUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
