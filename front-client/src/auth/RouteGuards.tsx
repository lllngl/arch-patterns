import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./routeGuards.css";

function FullPageLoader() {
  return (
    <div className="auth-loader-page">
      <div className="auth-loader-card">
        <h2 className="auth-loader-title">Загрузка...</h2>
        <p className="auth-loader-text">Проверяем сессию пользователя</p>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
