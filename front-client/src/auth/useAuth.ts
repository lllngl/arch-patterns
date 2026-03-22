import { useMemo } from "react";
import { useAuthStore } from "../stores/authStore";

/**
 * Хук совместимости с прежним API: UI не обращается к стору напрямую.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const loginWithLegacyPassword = useAuthStore((s) => s.loginWithLegacyPassword);

  return useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      /** Только если VITE_ENABLE_LEGACY_PASSWORD_LOGIN=true (разработка). */
      login: loginWithLegacyPassword,
      logout,
      refreshUser,
    }),
    [user, isInitializing, logout, refreshUser, loginWithLegacyPassword]
  );
}
