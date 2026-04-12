import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { toast } from "sonner";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import { useAppSettingsStore } from "./stores/app-settings";
import { initializeTelemetryLifecycle } from "./network/telemetry";
import { initializeEmployeePushNotifications } from "./push/firebase";
import {
  EMPLOYEE_OPERATION_EVENT_NAME,
  subscribeToEmployeeOperations,
} from "./network/ws/account-transactions";

function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);
  const bootstrapSettings = useAppSettingsStore((s) => s.bootstrap);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    initializeTelemetryLifecycle();
  }, []);

  useEffect(() => {
    void bootstrapSettings(user?.id);
  }, [bootstrapSettings, user?.id]);

  useEffect(() => {
    void initializeEmployeePushNotifications(user?.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    return subscribeToEmployeeOperations({
      onOperation: (event) => {
        window.dispatchEvent(
          new CustomEvent(EMPLOYEE_OPERATION_EVENT_NAME, {
            detail: event,
          })
        );

        toast.info("Поступила новая операция по счетам клиентов", {
          id: "employee-operations-feed",
          description:
            event.accountIds.length > 0
              ? `Затронуто счетов: ${event.accountIds.length}.`
              : "Событие поступило через employee realtime feed.",
        });
      },
    });
  }, [user?.id]);

  return <RouterProvider router={router} />;
}

export default App;
