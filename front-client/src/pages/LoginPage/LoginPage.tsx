import { useState } from "react";
import { buildAuthorizationRedirectUrl } from "../../use-cases/auth/oauthLoginUseCase";
import { clearOAuthCallbackCache } from "../../use-cases/auth/oauthCallbackDedup";
import "./LoginPage.css";

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      clearOAuthCallbackCache();
      const url = await buildAuthorizationRedirectUrl();
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось перейти к сервису аутентификации.");
      setIsLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Вход в банк</h1>
            <p className="login-subtitle">
              Пароль вводится только на странице единого сервиса аутентификации (OAuth 2.0 / OpenID Connect).
            </p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="login-oauth-block">
            <button type="button" className="btn btn-primary btn-full" disabled={isLoading} onClick={() => void handleOAuthLogin()}>
              {isLoading ? "Переход..." : "Войти через единый сервис"}
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p className="footer-text">Для регистрации обращайтесь к сотруднику банка.</p>
        </div>
      </div>
    </section>
  );
};
