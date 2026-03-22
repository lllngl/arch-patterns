import type { ReactNode } from "react";
import { ErrorBoundary } from "../errors/ErrorBoundary";
import { AppError } from "../errors/AppError";

function Fallback({ error, reset }: { error: AppError; reset: () => void }) {
  return (
    <div className="app-fallback">
      <div className="app-fallback-card">
        <h1 className="app-fallback-title">Что-то пошло не так</h1>
        <p className="app-fallback-text">{error.message}</p>
        <div className="app-fallback-actions">
          <button type="button" className="button button-primary" onClick={reset}>
            Попробовать снова
          </button>
          <button type="button" className="button button-secondary" onClick={() => window.location.assign("/")}>
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => <Fallback error={error} reset={reset} />}
      onError={(error) => {
        // eslint-disable-next-line no-console
        console.error("[AppErrorBoundary]", error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
