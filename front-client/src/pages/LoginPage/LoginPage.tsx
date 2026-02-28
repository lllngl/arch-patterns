import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ApiError } from "../../auth/api";
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
        setError("Неверный логин или пароль.");
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
            <p className="login-subtitle">Авторизуйтесь для доступа к счетам и кредитам</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
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
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
              {isLoading ? "Выполняется вход..." : "Войти"}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p className="footer-text">Для регистрации обращайтесь к сотруднику банка.</p>
        </div>
      </div>
    </section>
  );
};