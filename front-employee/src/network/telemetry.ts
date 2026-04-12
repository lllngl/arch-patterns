import { appEnv } from "@/config/env";
import {
  applyRequestMetadataHeaders,
  createRequestMetadata,
} from "./request-metadata";

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

function getPath(event: TelemetryEvent) {
  return event.url ?? window.location.pathname;
}

function getMethod(event: TelemetryEvent) {
  return event.method ?? "CLIENT";
}

function getDurationMs(event: TelemetryEvent) {
  return event.durationMs ?? 0;
}

function isErrorEvent(event: TelemetryEvent) {
  if (event.success === false) {
    return true;
  }

  if (event.status != null) {
    return event.status >= 400;
  }

  return (
    event.type === "circuit_breaker_opened" ||
    event.type === "circuit_breaker_blocked"
  );
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

    return false;
  }

  return false;
}

function mapTelemetryEvent(
  event: TelemetryEvent
): FrontendTelemetryEventRequest {
  return {
    traceId: event.traceId,
    serviceName: event.service ?? "front-employee",
    eventType: event.type,
    path: getPath(event),
    method: getMethod(event),
    statusCode: event.status,
    durationMs: getDurationMs(event),
    retryCount: event.retryCount,
    shortCircuited: event.type === "circuit_breaker_blocked",
    channel: getChannel(event),
    error: isErrorEvent(event),
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

export function enqueueTelemetry(
  event: Omit<TelemetryEvent, "timestamp">
) {
  if (!appEnv.monitoringIngestUrl || !shouldTrackEvent(event)) {
    return;
  }

  queue.push({
    ...event,
    timestamp: new Date().toISOString(),
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
  const accessToken =
    typeof window === "undefined" ? null : window.localStorage.getItem("accessToken");

  try {
    const results = await Promise.allSettled(
      batch.map(async (event) => {
        const metadata = createRequestMetadata(
          appEnv.monitoringIngestUrl!,
          "POST",
          event.traceId ? { traceId: event.traceId } : undefined
        );
        const response = await fetch(appEnv.monitoringIngestUrl!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...applyRequestMetadataHeaders({}, metadata),
          },
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
