import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { normalizeError } from "../../errors/normalizeError";
import { useNotificationStore } from "../../stores/notificationStore";
import "./AuthCallbackPage.css";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Завершение входа...");

  useEffect(() => {
    const run = async () => {
      try {
        await useAuthStore.getState().completeOAuthFromCallback({
          code: searchParams.get("code"),
          state: searchParams.get("state"),
          error: searchParams.get("error"),
        });
        useNotificationStore.getState().pushToast("success", "Вход выполнен.");
        navigate("/", { replace: true });
      } catch (err) {
        const appErr = normalizeError(err, "Не удалось завершить вход.");
        setMessage(appErr.message);
        useNotificationStore.getState().pushToast("error", appErr.message);
      }
    };

    void run();
  }, [navigate, searchParams]);

  return (
    <section className="auth-callback-page">
      <div className="auth-callback-card">
        <h1 className="auth-callback-title">Аутентификация</h1>
        <p className="auth-callback-text">{message}</p>
      </div>
    </section>
  );
}
