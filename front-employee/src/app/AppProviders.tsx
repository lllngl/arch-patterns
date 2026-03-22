import { useEffect, type ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AppErrorBoundary } from "@/components/custom/AppErrorBoundary";
import { useAppSettingsStore } from "@/stores/app-settings";

function ThemedToaster() {
  const { theme = "light" } = useTheme();

  return (
    <Toaster
      theme={theme as "light" | "dark"}
      richColors
      position="bottom-right"
    />
  );
}

function ThemeSettingsSynchronizer() {
  const storedTheme = useAppSettingsStore((state) => state.theme);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(storedTheme);
  }, [setTheme, storedTheme]);

  return null;
}

function ThemeBootstrap({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <ThemeSettingsSynchronizer />
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <ThemeBootstrap>{children}</ThemeBootstrap>
    </AppErrorBoundary>
  );
}
