import type { AppError } from "./AppError";

export type ErrorHandlerResult = "handled" | "bubble";

export type ErrorHandler = (error: AppError) => ErrorHandlerResult;

export function runErrorPipeline(error: AppError, handlers: ErrorHandler[]): ErrorHandlerResult {
  for (const handler of handlers) {
    const result = handler(error);
    if (result === "handled") {
      return "handled";
    }
  }
  return "bubble";
}
