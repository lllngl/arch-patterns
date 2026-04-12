const env = import.meta.env;

function getOptionalEnv(name: keyof ImportMetaEnv): string | null {
  const value = env[name];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getBooleanEnvWithDefault(
  name: keyof ImportMetaEnv,
  fallback: boolean
): boolean {
  const value = env[name];
  if (value == null || value === "") {
    return fallback;
  }

  return value === "true";
}

function getNumberEnvWithDefault(
  name: keyof ImportMetaEnv,
  fallback: number
): number {
  const value = getOptionalEnv(name);
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const appEnv = {
  requestTimeoutMs: getNumberEnvWithDefault("VITE_HTTP_TIMEOUT_MS", 15000),
  retryEnabled: getBooleanEnvWithDefault("VITE_HTTP_RETRY_ENABLED", true),
  retryMaxAttempts: getNumberEnvWithDefault("VITE_HTTP_RETRY_MAX_ATTEMPTS", 2),
  retryBaseDelayMs: getNumberEnvWithDefault("VITE_HTTP_RETRY_BASE_DELAY_MS", 400),
  retryJitterMs: getNumberEnvWithDefault("VITE_HTTP_RETRY_JITTER_MS", 250),
  circuitBreakerEnabled: getBooleanEnvWithDefault(
    "VITE_HTTP_CIRCUIT_BREAKER_ENABLED",
    true
  ),
  circuitBreakerWindowSize: getNumberEnvWithDefault(
    "VITE_HTTP_CIRCUIT_BREAKER_WINDOW_SIZE",
    10
  ),
  circuitBreakerMinimumSamples: getNumberEnvWithDefault(
    "VITE_HTTP_CIRCUIT_BREAKER_MINIMUM_SAMPLES",
    10
  ),
  circuitBreakerErrorThresholdPercent: getNumberEnvWithDefault(
    "VITE_HTTP_CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENT",
    70
  ),
  circuitBreakerOpenMs: getNumberEnvWithDefault(
    "VITE_HTTP_CIRCUIT_BREAKER_OPEN_MS",
    10000
  ),
  monitoringIngestUrl:
    getOptionalEnv("VITE_MONITORING_INGEST_URL") ??
    "/api/v1/monitoring/frontend/telemetry",
  monitoringBatchSize: getNumberEnvWithDefault("VITE_MONITORING_BATCH_SIZE", 10),
  monitoringFlushIntervalMs: getNumberEnvWithDefault(
    "VITE_MONITORING_FLUSH_INTERVAL_MS",
    5000
  ),
  pushAutoInitEnabled: getBooleanEnvWithDefault(
    "VITE_PUSH_AUTO_INIT_ENABLED",
    true
  ),
  pushRegistrationUrl: getOptionalEnv("VITE_PUSH_REGISTRATION_URL"),
  firebaseApiKey: getOptionalEnv("VITE_FIREBASE_API_KEY"),
  firebaseAuthDomain: getOptionalEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  firebaseProjectId: getOptionalEnv("VITE_FIREBASE_PROJECT_ID"),
  firebaseStorageBucket: getOptionalEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  firebaseMessagingSenderId: getOptionalEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  firebaseAppId: getOptionalEnv("VITE_FIREBASE_APP_ID"),
  firebaseVapidKey: getOptionalEnv("VITE_FIREBASE_VAPID_KEY"),
};
