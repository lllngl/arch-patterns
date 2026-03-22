/**
 * Ошибка HTTP API (4xx/5xx). Используется сетевым и API-слоем.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
