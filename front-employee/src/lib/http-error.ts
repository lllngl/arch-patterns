import axios from "axios";
import { localizeError } from "./error-messages";

export class AppError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, options?: {
    status?: number;
    code?: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "AppError";
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "Произошла ошибка";

    return new AppError(localizeError(message), {
      status: error.response?.status,
      code: error.code,
      details: error.response?.data,
    });
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError("Произошла ошибка");
}

export function getErrorMessage(error: unknown): string {
  return toAppError(error).message;
}
