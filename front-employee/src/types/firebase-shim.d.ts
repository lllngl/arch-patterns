declare module "firebase/app" {
  export function getApp(): unknown;
  export function getApps(): unknown[];
  export function initializeApp(config: Record<string, string>): unknown;
}

declare module "firebase/messaging" {
  export function getMessaging(app?: unknown): unknown;
  export function getToken(
    messaging: unknown,
    options?: {
      vapidKey?: string;
      serviceWorkerRegistration?: ServiceWorkerRegistration;
    }
  ): Promise<string>;
  export function isSupported(): Promise<boolean>;
  export function onMessage(
    messaging: unknown,
    nextOrObserver: (payload: {
      notification?: {
        title?: string;
        body?: string;
      };
    }) => void
  ): () => void;
}
