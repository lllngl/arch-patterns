import { useState } from 'react';
import './LoginPage.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // await api.login({ email, password });
      console.log('Login attempt:', { email, password });
    } catch (err) {
      setError('Неверный email или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Войти</h1>
            <p className="login-subtitle">Добро пожаловать обратно!</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && <div className="form-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Пароль</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="form-actions">
              <a href="/forgot-password" className="form-link">
                Забыли пароль?
              </a>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Войти'}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p className="footer-text">
            Нет аккаунта?{' '}
            <a href="/registration" className="footer-link">
              Зарегистрироваться
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};