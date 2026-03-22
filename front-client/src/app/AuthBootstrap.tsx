import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../stores/authStore";
import { useAppSettingsStore } from "../stores/appSettingsStore";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().initialize();
    void useAppSettingsStore.getState().load();
  }, []);

  return <>{children}</>;
}
