import { ApiError } from "./ApiError";

export type ErrorSeverity = "page" | "global";

/**
 * Нормализованная ошибка приложения для конвейера обработки.
 */
export class AppError extends Error {
  readonly code: string;
  readonly severity: ErrorSeverity;
  readonly cause?: unknown;

  constructor(message: string, code: string, severity: ErrorSeverity = "page", cause?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.cause = cause;
  }

  static fromApi(err: ApiError): AppError {
    return new AppError(err.message, `HTTP_${err.status}`, err.status >= 500 ? "global" : "page", err);
  }

  static fromUnknown(err: unknown, fallbackMessage: string): AppError {
    if (err instanceof AppError) {
      return err;
    }
    if (err instanceof Error) {
      return new AppError(err.message, "UNKNOWN", "page", err);
    }
    return new AppError(fallbackMessage, "UNKNOWN", "page", err);
  }
}
