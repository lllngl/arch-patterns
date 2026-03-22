/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OAUTH_AUTHORIZATION_ENDPOINT?: string;
  readonly VITE_OAUTH_TOKEN_ENDPOINT?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
  readonly VITE_OAUTH_REDIRECT_URI?: string;
  readonly VITE_OAUTH_STUB?: string;
  readonly VITE_ACCOUNT_WS_BROKER_URL?: string;
  readonly VITE_APP_SETTINGS_DISABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
