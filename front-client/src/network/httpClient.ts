import { ApiError } from "../errors/ApiError";
import type { z } from "zod";

export interface HttpClientConfig {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

export interface RequestJsonOptions extends Omit<RequestInit, "body"> {
  requiresAuth?: boolean;
  body?: unknown;
  parse?: (raw: unknown) => unknown;
}

/**
 * Сетевой слой: fetch, заголовки, 401 refresh. Не знает о бизнес-логике и UI.
 */
export class HttpClient {
  private refreshPromise: Promise<string | null> | null = null;

  constructor(private readonly config: HttpClientConfig) {}

  async requestJson<T>(url: string, options: RequestJsonOptions = {}): Promise<T> {
    const { requiresAuth = true, headers, body, parse, ...rest } = options;
    const requestHeaders = new Headers(headers);
    requestHeaders.set("Content-Type", "application/json");

    if (requiresAuth) {
      const token = this.config.getAccessToken();
      if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
      }
    }

    const init: RequestInit = {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    let response = await fetch(url, init);

    if (response.status === 401 && requiresAuth) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.config.refreshAccessToken();
      }
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;

      if (!newToken) {
        throw new ApiError(401, "Unauthorized");
      }

      requestHeaders.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, {
        ...rest,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }

    if (!response.ok) {
      throw new ApiError(response.status, await parseErrorMessage(response));
    }

    if (response.status === 204) {
      return null as T;
    }

    const raw: unknown = await response.json();
    if (parse) {
      return parse(raw) as T;
    }
    return raw as T;
  }

  async parseWithSchema<T>(schema: z.ZodType<T>, raw: unknown): Promise<T> {
    return schema.parseAsync(raw);
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === "string") {
      return data;
    }
    if (typeof data === "object" && data !== null) {
      const rec = data as Record<string, unknown>;
      if (typeof rec.message === "string") {
        return rec.message;
      }
      if (typeof rec.error === "string") {
        return rec.error;
      }
    }
  } catch {
    //
  }
  return `Request failed with status ${response.status}`;
}
