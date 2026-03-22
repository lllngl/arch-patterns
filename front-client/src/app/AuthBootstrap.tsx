import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../stores/authStore";
import { useAppSettingsStore } from "../stores/appSettingsStore";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    void useAuthStore.getState().initialize();
    void useAppSettingsStore.getState().load();
  }, []);

  /** Повторная загрузка настроек после появления сессии (первый load часто уходит без JWT → 401). */
  useEffect(() => {
    if (!isInitializing && user?.id) {
      void useAppSettingsStore.getState().load();
    }
  }, [isInitializing, user?.id]);

  return <>{children}</>;
}
