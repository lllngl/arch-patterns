/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OAUTH_AUTHORIZATION_ENDPOINT?: string;
  readonly VITE_OAUTH_TOKEN_ENDPOINT?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
  readonly VITE_OAUTH_REDIRECT_URI?: string;
  readonly VITE_OAUTH_STUB?: string;
  readonly VITE_ENABLE_LEGACY_PASSWORD_LOGIN?: string;
  readonly VITE_TRANSFER_ENDPOINT?: string;
  readonly VITE_WS_TRANSACTIONS_URL?: string;
  readonly VITE_APP_SETTINGS_DISABLED?: string;
  readonly VITE_CREDIT_OVERDUE_ENDPOINT?: string;
  readonly VITE_CREDIT_RATING_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
