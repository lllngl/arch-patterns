import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { AppError } from "../errors/AppError";
import { ApiError } from "../errors/ApiError";

export function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  let message = "Произошла ошибка.";
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText || ""}`.trim();
  } else if (error instanceof AppError) {
    message = error.message;
  } else if (error instanceof ApiError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="app-fallback">
      <div className="app-fallback-card">
        <h1 className="app-fallback-title">Ошибка маршрута</h1>
        <p className="app-fallback-text">{message}</p>
        <button type="button" className="button button-primary" onClick={() => navigate(-1)}>
          Назад
        </button>
      </div>
    </div>
  );
}
