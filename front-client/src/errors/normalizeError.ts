import { ApiError } from "./ApiError";
import { AppError } from "./AppError";

export function normalizeError(err: unknown, fallbackMessage: string): AppError {
  if (err instanceof AppError) {
    return err;
  }
  if (err instanceof ApiError) {
    return AppError.fromApi(err);
  }
  if (err instanceof Error) {
    return new AppError(err.message || fallbackMessage, "RUNTIME", "page", err);
  }
  return new AppError(fallbackMessage, "UNKNOWN", "page", err);
}
