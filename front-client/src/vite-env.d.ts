/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OAUTH_AUTHORIZATION_ENDPOINT?: string;
  readonly VITE_OAUTH_TOKEN_ENDPOINT?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
  readonly VITE_OAUTH_REDIRECT_URI?: string;
  readonly VITE_OAUTH_STUB?: string;
  readonly VITE_ACCOUNT_WS_BROKER_URL?: string;
  readonly VITE_APP_SETTINGS_DISABLED?: string;
  readonly VITE_HTTP_TIMEOUT_MS?: string;
  readonly VITE_HTTP_RETRY_ENABLED?: string;
  readonly VITE_HTTP_RETRY_MAX_ATTEMPTS?: string;
  readonly VITE_HTTP_RETRY_BASE_DELAY_MS?: string;
  readonly VITE_HTTP_RETRY_JITTER_MS?: string;
  readonly VITE_HTTP_CIRCUIT_BREAKER_ENABLED?: string;
  readonly VITE_HTTP_CIRCUIT_BREAKER_WINDOW_SIZE?: string;
  readonly VITE_HTTP_CIRCUIT_BREAKER_MINIMUM_SAMPLES?: string;
  readonly VITE_HTTP_CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENT?: string;
  readonly VITE_HTTP_CIRCUIT_BREAKER_OPEN_MS?: string;
  readonly VITE_MONITORING_INGEST_URL?: string;
  readonly VITE_MONITORING_BATCH_SIZE?: string;
  readonly VITE_MONITORING_FLUSH_INTERVAL_MS?: string;
  readonly VITE_PUSH_AUTO_INIT_ENABLED?: string;
  readonly VITE_PUSH_REGISTRATION_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_VAPID_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
