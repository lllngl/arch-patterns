import { ApiError } from "../errors/ApiError";
import { appEnv } from "../config/env";
import type { z } from "zod";
import {
  applyRequestMetadataHeaders,
  createRequestMetadata,
  getRequestDurationMs,
  type RequestMetadata,
} from "./requestMetadata";
import {
  assertCircuitClosed,
  isCircuitCurrentlyOpen,
  recordCircuitOutcome,
  shouldRetryRequest,
  sleepForRetry,
} from "./resilience";
import { enqueueTelemetry } from "./telemetry";

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
  requestMetadata?: Partial<RequestMetadata>;
  skipRetry?: boolean;
  skipCircuitBreaker?: boolean;
  skipTelemetry?: boolean;
  retryCount?: number;
}

export class HttpClient {
  private refreshPromise: Promise<string | null> | null = null;

  constructor(private readonly config: HttpClientConfig) {}

  async requestJson<T>(url: string, options: RequestJsonOptions = {}): Promise<T> {
    const {
      requiresAuth = true,
      headers,
      body,
      parse,
      requestMetadata,
      skipRetry = false,
      skipCircuitBreaker = false,
      skipTelemetry = false,
      retryCount = 0,
      ...rest
    } = options;

    let metadata = createRequestMetadata(url, options.method, {
      ...requestMetadata,
      retryCount,
    });
    let didRefreshToken = false;

    while (true) {
      const requestHeaders = new Headers(headers);
      requestHeaders.set("Content-Type", "application/json");
      applyRequestMetadataHeaders(requestHeaders, metadata);

      if (requiresAuth) {
        const token = this.config.getAccessToken();
        if (token) {
          requestHeaders.set("Authorization", `Bearer ${token}`);
        }
      }

      if (!skipCircuitBreaker) {
        assertCircuitClosed(metadata);
      }

      try {
        const response = await this.fetchWithTimeout(url, {
          ...rest,
          headers: requestHeaders,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        if (
          response.status === 401 &&
          requiresAuth &&
          !didRefreshToken &&
          !url.includes("/api/v1/auth/")
        ) {
          if (!this.refreshPromise) {
            this.refreshPromise = this.config.refreshAccessToken();
          }
          const newToken = await this.refreshPromise;
          this.refreshPromise = null;

          if (!newToken) {
            throw new ApiError(401, "Unauthorized");
          }

          didRefreshToken = true;
          continue;
        }

        if (!response.ok) {
          throw new ApiError(response.status, await parseErrorMessage(response));
        }

        const errorRatePercent = recordCircuitOutcome(metadata, true);
        if (!skipTelemetry) {
          enqueueTelemetry({
            type: "http_request",
            traceId: metadata.traceId,
            service: metadata.serviceKey,
            method: metadata.method,
            url: metadata.url,
            status: response.status,
            durationMs: getRequestDurationMs(metadata),
            success: true,
            retryCount: metadata.retryCount,
            errorRatePercent,
          });
        }

        if (response.status === 204) {
          return null as T;
        }

        const rawText = await response.text();
        if (!rawText.trim()) {
          return null as T;
        }

        const raw: unknown = JSON.parse(rawText);
        if (parse) {
          return parse(raw) as T;
        }
        return raw as T;
      } catch (error) {
        const errorRatePercent = recordCircuitOutcome(metadata, false);

        if (
          !isCircuitCurrentlyOpen(metadata.serviceKey) &&
          shouldRetryRequest(error, metadata, skipRetry)
        ) {
          const nextRetryCount = metadata.retryCount + 1;
          const delayMs = await sleepForRetry(metadata.retryCount);

          metadata = {
            ...metadata,
            retryCount: nextRetryCount,
          };

          if (!skipTelemetry) {
            enqueueTelemetry({
              type: "http_retry",
              traceId: metadata.traceId,
              service: metadata.serviceKey,
              method: metadata.method,
              url: metadata.url,
              retryCount: nextRetryCount,
              errorRatePercent,
              message: `Retry after ${Math.round(delayMs)}ms`,
            });
          }

          continue;
        }

        if (!skipTelemetry) {
          const status = error instanceof ApiError ? error.status : undefined;
          const message =
            error instanceof Error
              ? error.message
              : `Request failed with status ${status ?? "unknown"}`;

          enqueueTelemetry({
            type: "http_request",
            traceId: metadata.traceId,
            service: metadata.serviceKey,
            method: metadata.method,
            url: metadata.url,
            status,
            durationMs: getRequestDurationMs(metadata),
            success: false,
            retryCount: metadata.retryCount,
            errorRatePercent,
            message,
          });
        }

        throw error;
      }
    }
  }

  async parseWithSchema<T>(schema: z.ZodType<T>, raw: unknown): Promise<T> {
    return schema.parseAsync(raw);
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, appEnv.requestTimeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError(408, "Request timeout");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
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
  } catch {}
  return `Request failed with status ${response.status}`;
}
