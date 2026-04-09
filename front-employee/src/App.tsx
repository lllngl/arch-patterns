import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import { useAppSettingsStore } from "./stores/app-settings";

function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);
  const bootstrapSettings = useAppSettingsStore((s) => s.bootstrap);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    void bootstrapSettings(user?.id);
  }, [bootstrapSettings, user?.id]);

  return <RouterProvider router={router} />;
}

export default App;
