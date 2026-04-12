import "axios";
import type { RequestMetadata } from "../network/request-metadata";

declare module "axios" {
  interface AxiosRequestConfig<D = unknown> {
    _retry?: boolean;
    __retryCount?: number;
    __skipRetry?: boolean;
    __skipCircuitBreaker?: boolean;
    __skipTelemetry?: boolean;
    __requestMetadata?: RequestMetadata;
  }

  interface InternalAxiosRequestConfig<D = unknown> {
    _retry?: boolean;
    __retryCount?: number;
    __skipRetry?: boolean;
    __skipCircuitBreaker?: boolean;
    __skipTelemetry?: boolean;
    __requestMetadata?: RequestMetadata;
  }
}
