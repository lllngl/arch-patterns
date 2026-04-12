export interface RequestMetadata {
  traceId: string;
  requestId: string;
  idempotencyKey?: string;
  startedAt: number;
  retryCount: number;
  serviceKey: string;
  method: string;
  url: string;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeMethod(method?: string) {
  return (method ?? "GET").toUpperCase();
}

export function shouldAttachIdempotencyKey(method?: string) {
  return MUTATING_METHODS.has(normalizeMethod(method));
}

export function resolveServiceKey(url?: string) {
  const source = url ?? "";

  if (source.includes("/api/v1/users")) {
    return "users-service";
  }

  if (
    source.includes("/api/v1/accounts") ||
    source.includes("/ws") ||
    source.includes("/topic/accounts")
  ) {
    return "account-service";
  }

  if (source.includes("/api/v1/loan") || source.includes("/api/v1/tariffs")) {
    return "loan-service";
  }

  if (source.includes("/api/v1/preferences")) {
    return "preferences-service";
  }

  if (source.includes("/api/v1/auth")) {
    return "auth-service";
  }

  if (source.includes("/realms/")) {
    return "keycloak";
  }

  return "frontend-external";
}

export function createRequestMetadata(
  url: string,
  method?: string,
  previous?: Partial<RequestMetadata>
): RequestMetadata {
  const normalizedMethod = normalizeMethod(method);

  return {
    traceId: previous?.traceId ?? crypto.randomUUID(),
    requestId: previous?.requestId ?? crypto.randomUUID(),
    idempotencyKey:
      previous?.idempotencyKey ??
      (shouldAttachIdempotencyKey(normalizedMethod)
        ? crypto.randomUUID()
        : undefined),
    startedAt: previous?.startedAt ?? Date.now(),
    retryCount: previous?.retryCount ?? 0,
    serviceKey: previous?.serviceKey ?? resolveServiceKey(url),
    method: normalizedMethod,
    url,
  };
}

export function applyRequestMetadataHeaders(
  headers: Headers,
  metadata: RequestMetadata
) {
  headers.set("X-Trace-Id", metadata.traceId);
  headers.set("X-Request-Id", metadata.requestId);
  headers.set("X-Client-Service", "front-client");

  if (metadata.idempotencyKey) {
    headers.set("Idempotency-Key", metadata.idempotencyKey);
  }
}

export function getRequestDurationMs(metadata: RequestMetadata) {
  return Date.now() - metadata.startedAt;
}
