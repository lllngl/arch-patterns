import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../errors/ApiError";
import { buildAuthorizationRedirectUrl } from "../../use-cases/auth/oauthLoginUseCase";
import { isLegacyPasswordLoginEnabled } from "../../use-cases/auth/legacyLoginUseCase";
import { useAuth } from "../../auth/useAuth";
import "./LoginPage.css";

interface LoginLocationState {
  from?: string;
}

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as LoginLocationState | null)?.from ?? "/";
  const legacyEnabled = isLegacyPasswordLoginEnabled();

  const handleOAuthLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = await buildAuthorizationRedirectUrl();
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось перейти к сервису аутентификации.");
      setIsLoading(false);
    }
  };

  const handleLegacySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Доступ в клиентское приложение разрешен только роли CLIENT.");
      } else {
        setError("Не удалось выполнить вход.");
      }
    } finally {
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
            <p className="login-hint">
              Настройте переменные <code>VITE_OAUTH_AUTHORIZATION_ENDPOINT</code> и <code>VITE_OAUTH_CLIENT_ID</code>. Обмен кода на
              токены — <code>VITE_OAUTH_TOKEN_ENDPOINT</code>.
            </p>
          </div>

          {legacyEnabled && (
            <form onSubmit={(e) => void handleLegacySubmit(e)} className="login-form login-form-legacy" noValidate>
              <p className="login-legacy-title">Режим разработки (пароль на клиенте)</p>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Логин
                </label>
                <input
                  id="email"
                  type="text"
                  className="form-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-full" disabled={isLoading}>
                {isLoading ? "Выполняется вход..." : "Войти (legacy)"}
              </button>
            </form>
          )}
        </div>

        <div className="login-footer">
          <p className="footer-text">Для регистрации обращайтесь к сотруднику банка.</p>
        </div>
      </div>
    </section>
  );
};
