import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useAppSettingsStore } from "../stores/appSettingsStore";
import { ToastStack } from "../ui/ToastStack/ToastStack";
import "./AppLayout.css";
import "../ui/ToastStack/ToastStack.css";

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useAppSettingsStore((s) => s.theme);
  const setTheme = useAppSettingsStore((s) => s.setTheme);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            Internet Bank
          </Link>

          <nav>
            <ul className="nav-list">
              <li>
                <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}>
                  Главная
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}>
                  Профиль
                </NavLink>
              </li>
              <li>
                <NavLink to="/loans" className={({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`}>
                  Кредиты
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            <div className="theme-switch" role="group" aria-label="Тема оформления">
              <button
                type="button"
                className={`theme-btn${theme === "light" ? " theme-btn-active" : ""}`}
                onClick={() => void setTheme("light")}
              >
                Светлая
              </button>
              <button
                type="button"
                className={`theme-btn${theme === "dark" ? " theme-btn-active" : ""}`}
                onClick={() => void setTheme("dark")}
              >
                Тёмная
              </button>
            </div>
            <span className="user-email">{user?.email}</span>
            <button type="button" className="logout-button" onClick={() => void handleLogout()}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <p>© 2026 Интернет-банк для клиентов</p>
      </footer>

      <ToastStack />
    </div>
  );
};
