import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./AppLayout.css";

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            </ul>
          </nav>

          <div className="header-actions">
            <span className="user-email">{user?.email}</span>
            <button type="button" className="logout-button" onClick={handleLogout}>
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
    </div>
  );
};
