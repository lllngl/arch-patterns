import axios from "axios";
import { appEnv } from "@/config/env";
import { toAppError } from "@/lib/http-error";
import { getAccessToken, getRefreshToken, setTokens, useAuthStore } from "@/stores/auth";
import {
  applyRequestMetadataHeaders,
  createRequestMetadata,
  getRequestDurationMs,
} from "./request-metadata";
import {
  assertCircuitClosed,
  isCircuitCurrentlyOpen,
  recordCircuitOutcome,
  shouldRetryRequest,
  sleepForRetry,
} from "./resilience";
import { enqueueTelemetry } from "./telemetry";

export const httpClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

function setHeader(
  headers: Record<string, unknown> | undefined,
  key: string,
  value: string
) {
  if (!headers) {
    return;
  }

  const target = headers as {
    set?: (header: string, nextValue: string) => void;
    [key: string]: unknown;
  };

  if (typeof target.set === "function") {
    target.set(key, value);
    return;
  }

  target[key] = value;
}

httpClient.interceptors.request.use((config) => {
  const metadata = createRequestMetadata(
    String(config.url ?? ""),
    config.method,
    config.__requestMetadata
  );

  config.__requestMetadata = metadata;
  config.timeout = appEnv.requestTimeoutMs;

  if (!config.__skipCircuitBreaker) {
    assertCircuitClosed(metadata);
  }

  for (const [header, value] of Object.entries(
    applyRequestMetadataHeaders({}, metadata)
  )) {
    setHeader(config.headers, header, value);
  }

  const token = getAccessToken();
  if (token) {
    setHeader(config.headers, "Authorization", `Bearer ${token}`);
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((entry) => {
    if (error) {
      entry.reject(error);
      return;
    }

    if (token) {
      entry.resolve(token);
    }
  });

  failedQueue = [];
}

httpClient.interceptors.response.use(
  (response) => {
    const metadata = response.config.__requestMetadata;
    if (metadata) {
      const errorRatePercent = recordCircuitOutcome(metadata, true);

      if (!response.config.__skipTelemetry) {
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
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const metadata = createRequestMetadata(
      String(originalRequest?.url ?? ""),
      originalRequest?.method,
      originalRequest?.__requestMetadata
    );

    if (originalRequest) {
      originalRequest.__requestMetadata = metadata;
      originalRequest.timeout = appEnv.requestTimeoutMs;
    }

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !String(originalRequest?.url).includes("/api/v1/auth/")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              setHeader(
                originalRequest.headers,
                "Authorization",
                `Bearer ${token}`
              );
              resolve(httpClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const refreshMetadata = createRequestMetadata(
          "/api/v1/auth/refresh",
          "POST"
        );
        const refreshHeaders = applyRequestMetadataHeaders({}, refreshMetadata);

        const { data } = await axios.post(
          "/api/v1/auth/refresh",
          {
            refreshToken,
          },
          {
            timeout: appEnv.requestTimeoutMs,
            headers: refreshHeaders,
          }
        );

        setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        setHeader(
          originalRequest.headers,
          "Authorization",
          `Bearer ${data.accessToken}`
        );

        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorRatePercent = metadata
      ? recordCircuitOutcome(metadata, false)
      : 0;

    if (
      originalRequest &&
      !isCircuitCurrentlyOpen(metadata.serviceKey) &&
      shouldRetryRequest(error, metadata, Boolean(originalRequest.__skipRetry))
    ) {
      const nextRetryCount = metadata.retryCount + 1;
      const delayMs = await sleepForRetry(metadata.retryCount);

      originalRequest.__requestMetadata = {
        ...metadata,
        retryCount: nextRetryCount,
      };
      originalRequest.__retryCount = nextRetryCount;

      if (!originalRequest.__skipTelemetry) {
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

      return httpClient(originalRequest);
    }

    if (metadata && !originalRequest?.__skipTelemetry) {
      const appError = toAppError(error);

      enqueueTelemetry({
        type: "http_request",
        traceId: metadata.traceId,
        service: metadata.serviceKey,
        method: metadata.method,
        url: metadata.url,
        status: appError.status,
        durationMs: getRequestDurationMs(metadata),
        success: false,
        retryCount: metadata.retryCount,
        errorRatePercent,
        message: appError.message,
      });
    }

    return Promise.reject(error);
  }
);
