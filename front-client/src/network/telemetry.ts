import { appEnv } from "../config/env";
import {
  applyRequestMetadataHeaders,
  createRequestMetadata,
} from "./requestMetadata";

type TelemetryEventType =
  | "http_request"
  | "http_retry"
  | "circuit_breaker_opened"
  | "circuit_breaker_closed"
  | "circuit_breaker_blocked"
  | "realtime"
  | "push";

export interface TelemetryEvent {
  type: TelemetryEventType;
  timestamp: string;
  traceId?: string;
  service?: string;
  method?: string;
  url?: string;
  status?: number;
  durationMs?: number;
  success?: boolean;
  retryCount?: number;
  errorRatePercent?: number;
  state?: string;
  message?: string;
  details?: Record<string, unknown>;
}

const queue: TelemetryEvent[] = [];
let flushTimer: number | null = null;
let isFlushing = false;
let lifecycleInitialized = false;

function toBackendLocalDateTime(value: Date) {
  return value.toISOString().replace("Z", "");
}

interface FrontendTelemetryEventRequest {
  traceId?: string;
  serviceName: string;
  eventType: string;
  path: string;
  method: string;
  statusCode?: number;
  durationMs: number;
  retryCount?: number;
  shortCircuited?: boolean;
  channel: string;
  error: boolean;
  errorMessage?: string;
  occurredAt: string;
}

function getChannel(event: TelemetryEvent) {
  if (event.type === "realtime") {
    return "realtime";
  }

  if (event.type === "push") {
    return "push";
  }

  return "http";
}

function shouldTrackEvent(event: Omit<TelemetryEvent, "timestamp">) {
  if (
    event.type === "circuit_breaker_opened" ||
    event.type === "circuit_breaker_closed" ||
    event.type === "circuit_breaker_blocked" ||
    event.type === "http_retry"
  ) {
    return true;
  }

  if (event.type === "http_request") {
    if (event.success === false) {
      return true;
    }

    if (event.status != null) {
      return event.status >= 400;
    }
  }

  return false;
}

function mapTelemetryEvent(
  event: TelemetryEvent
): FrontendTelemetryEventRequest {
  return {
    traceId: event.traceId,
    serviceName: event.service ?? "front-client",
    eventType: event.type,
    path: event.url ?? window.location.pathname,
    method: event.method ?? "CLIENT",
    statusCode: event.status,
    durationMs: event.durationMs ?? 0,
    retryCount: event.retryCount,
    shortCircuited: event.type === "circuit_breaker_blocked",
    channel: getChannel(event),
    error:
      event.success === false ||
      (event.status != null && event.status >= 400) ||
      event.type === "circuit_breaker_opened" ||
      event.type === "circuit_breaker_blocked",
    errorMessage: event.message,
    occurredAt: event.timestamp,
  };
}

function scheduleFlush() {
  if (!appEnv.monitoringIngestUrl || flushTimer !== null) {
    return;
  }

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushTelemetry();
  }, appEnv.monitoringFlushIntervalMs);
}

export function enqueueTelemetry(event: Omit<TelemetryEvent, "timestamp">) {
  if (!appEnv.monitoringIngestUrl || !shouldTrackEvent(event)) {
    return;
  }

  queue.push({
    ...event,
    timestamp: toBackendLocalDateTime(new Date()),
  });

  if (queue.length >= appEnv.monitoringBatchSize) {
    void flushTelemetry();
    return;
  }

  scheduleFlush();
}

export async function flushTelemetry() {
  if (!appEnv.monitoringIngestUrl || isFlushing || queue.length === 0) {
    return;
  }

  isFlushing = true;
  const batch = queue.splice(0, appEnv.monitoringBatchSize);
  const accessToken = window.localStorage.getItem("accessToken");

  try {
    const results = await Promise.allSettled(
      batch.map(async (event) => {
        const metadata = createRequestMetadata(
          appEnv.monitoringIngestUrl!,
          "POST",
          event.traceId ? { traceId: event.traceId } : undefined
        );
        const headers = new Headers({
          "Content-Type": "application/json",
        });

        if (accessToken) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
        applyRequestMetadataHeaders(headers, metadata);

        const response = await fetch(appEnv.monitoringIngestUrl!, {
          method: "POST",
          headers,
          body: JSON.stringify(mapTelemetryEvent(event)),
          keepalive: true,
        });

        if (!response.ok) {
          throw new Error("Telemetry ingest failed.");
        }
      })
    );

    const failedEvents = batch.filter((_, index) => {
      const result = results[index];
      return result?.status === "rejected";
    });

    if (failedEvents.length > 0) {
      queue.unshift(...failedEvents.slice(-100));
    }
  } catch {
    queue.unshift(...batch.slice(-100));
  } finally {
    isFlushing = false;
    if (queue.length > 0) {
      scheduleFlush();
    }
  }
}

export function initializeTelemetryLifecycle() {
  if (lifecycleInitialized || typeof window === "undefined") {
    return;
  }

  lifecycleInitialized = true;
  window.addEventListener("pagehide", () => {
    void flushTelemetry();
  });
}
