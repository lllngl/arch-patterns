import { ApiError } from "../errors/ApiError";
import { appEnv } from "../config/env";
import type { RequestMetadata } from "./requestMetadata";
import { enqueueTelemetry } from "./telemetry";

interface CircuitState {
  state: "closed" | "open";
  openedUntil: number | null;
  outcomes: boolean[];
  errorRatePercent: number;
}

const RESILIENCE_SERVICES = new Set([
  "users-service",
  "account-service",
  "loan-service",
]);

const circuitStates = new Map<string, CircuitState>();

function getCircuitState(serviceKey: string) {
  const existing = circuitStates.get(serviceKey);
  if (existing) {
    return existing;
  }

  const created: CircuitState = {
    state: "closed",
    openedUntil: null,
    outcomes: [],
    errorRatePercent: 0,
  };

  circuitStates.set(serviceKey, created);
  return created;
}

function isResilienceManagedService(serviceKey: string) {
  return RESILIENCE_SERVICES.has(serviceKey);
}

function computeErrorRatePercent(outcomes: boolean[]) {
  if (outcomes.length === 0) {
    return 0;
  }

  const errors = outcomes.filter((value) => !value).length;
  return Math.round((errors / outcomes.length) * 100);
}

function closeCircuit(serviceKey: string, reason: "timer" | "success") {
  const state = getCircuitState(serviceKey);
  if (state.state === "closed") {
    return;
  }

  state.state = "closed";
  state.openedUntil = null;

  enqueueTelemetry({
    type: "circuit_breaker_closed",
    service: serviceKey,
    errorRatePercent: state.errorRatePercent,
    state: reason,
  });
}

export function isCircuitCurrentlyOpen(serviceKey: string) {
  const state = getCircuitState(serviceKey);
  return (
    state.state === "open" &&
    state.openedUntil !== null &&
    state.openedUntil > Date.now()
  );
}

export function assertCircuitClosed(metadata: RequestMetadata) {
  if (
    !appEnv.circuitBreakerEnabled ||
    !isResilienceManagedService(metadata.serviceKey)
  ) {
    return;
  }

  const state = getCircuitState(metadata.serviceKey);
  if (state.state !== "open") {
    return;
  }

  if (state.openedUntil !== null && state.openedUntil <= Date.now()) {
    closeCircuit(metadata.serviceKey, "timer");
    return;
  }

  enqueueTelemetry({
    type: "circuit_breaker_blocked",
    traceId: metadata.traceId,
    service: metadata.serviceKey,
    method: metadata.method,
    url: metadata.url,
    errorRatePercent: state.errorRatePercent,
  });

  throw new ApiError(
    503,
    "Сервис временно отключён из-за слишком большого процента ошибок. Попробуйте позже."
  );
}

export function recordCircuitOutcome(metadata: RequestMetadata, success: boolean) {
  if (!isResilienceManagedService(metadata.serviceKey)) {
    return 0;
  }

  const state = getCircuitState(metadata.serviceKey);
  state.outcomes.push(success);

  if (state.outcomes.length > appEnv.circuitBreakerWindowSize) {
    state.outcomes.shift();
  }

  state.errorRatePercent = computeErrorRatePercent(state.outcomes);

  if (
    appEnv.circuitBreakerEnabled &&
    !success &&
    state.outcomes.length >= appEnv.circuitBreakerMinimumSamples &&
    state.errorRatePercent >= appEnv.circuitBreakerErrorThresholdPercent
  ) {
    state.state = "open";
    state.openedUntil = Date.now() + appEnv.circuitBreakerOpenMs;

    enqueueTelemetry({
      type: "circuit_breaker_opened",
      traceId: metadata.traceId,
      service: metadata.serviceKey,
      method: metadata.method,
      url: metadata.url,
      errorRatePercent: state.errorRatePercent,
    });
  } else if (success) {
    closeCircuit(metadata.serviceKey, "success");
  }

  return state.errorRatePercent;
}

function getStatus(error: unknown) {
  if (error instanceof ApiError) {
    return error.status;
  }

  return null;
}

function getMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function shouldRetryRequest(
  error: unknown,
  metadata: RequestMetadata,
  skipRetry: boolean
) {
  if (
    skipRetry ||
    !appEnv.retryEnabled ||
    !isResilienceManagedService(metadata.serviceKey) ||
    metadata.retryCount >= appEnv.retryMaxAttempts
  ) {
    return false;
  }

  if (getMessage(error).includes("временно отключён")) {
    return false;
  }

  const status = getStatus(error);
  if (status == null) {
    return true;
  }

  return status >= 500;
}

export function getRetryDelayMs(retryCount: number) {
  const exponentialDelay = appEnv.retryBaseDelayMs * 2 ** retryCount;
  const jitter = Math.random() * appEnv.retryJitterMs;
  return exponentialDelay + jitter;
}

export async function sleepForRetry(retryCount: number) {
  const delay = getRetryDelayMs(retryCount);
  await new Promise((resolve) => window.setTimeout(resolve, delay));
  return delay;
}
