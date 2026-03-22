import { useMemo } from "react";
import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  return useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      logout,
      refreshUser,
    }),
    [user, isInitializing, logout, refreshUser]
  );
}
