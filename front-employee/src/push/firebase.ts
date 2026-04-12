import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { appEnv } from "@/config/env";
import { getAccessToken } from "@/stores/auth";
import { enqueueTelemetry } from "@/network/telemetry";
import { getOrCreateDeviceId, preferencesApi } from "@/api/preferences";

const PUSH_TOKEN_STORAGE_KEY = "front-employee:push:fcm-token";

let initializedForUserId: string | null = null;
let foregroundListenerBound = false;

function getFirebaseConfig() {
  if (
    !appEnv.firebaseApiKey ||
    !appEnv.firebaseAuthDomain ||
    !appEnv.firebaseProjectId ||
    !appEnv.firebaseStorageBucket ||
    !appEnv.firebaseMessagingSenderId ||
    !appEnv.firebaseAppId
  ) {
    return null;
  }

  return {
    apiKey: appEnv.firebaseApiKey,
    authDomain: appEnv.firebaseAuthDomain,
    projectId: appEnv.firebaseProjectId,
    storageBucket: appEnv.firebaseStorageBucket,
    messagingSenderId: appEnv.firebaseMessagingSenderId,
    appId: appEnv.firebaseAppId,
  };
}

async function registerPushToken(pushToken: string) {
  const deviceId = getOrCreateDeviceId();

  if (!appEnv.pushRegistrationUrl) {
    await preferencesApi.registerPushToken(deviceId, pushToken);
    return;
  }

  const accessToken = getAccessToken();
  const response = await fetch(appEnv.pushRegistrationUrl.replace("{deviceId}", deviceId), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      pushToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Push registration request failed.");
  }
}

export async function initializeEmployeePushNotifications(
  userId: string | null | undefined
) {
  if (
    !userId ||
    !appEnv.pushAutoInitEnabled ||
    initializedForUserId === userId
  ) {
    return;
  }

  if (!(await isSupported())) {
    enqueueTelemetry({
      type: "push",
      service: "firebase-push",
      state: "unsupported",
      message: "Firebase messaging is not supported in this browser.",
    });
    return;
  }

  const firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig || !appEnv.firebaseVapidKey) {
    enqueueTelemetry({
      type: "push",
      service: "firebase-push",
      state: "blocked",
      message: "Firebase configuration is incomplete.",
    });
    return;
  }

  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    enqueueTelemetry({
      type: "push",
      service: "firebase-push",
      state: "unsupported",
      message: "Service worker or Notification API is unavailable.",
    });
    return;
  }

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== "granted") {
    enqueueTelemetry({
      type: "push",
      service: "firebase-push",
      state: permission,
      message: "Notification permission was not granted.",
    });
    return;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;

  serviceWorkerRegistration.active?.postMessage({
    type: "INIT_FIREBASE_MESSAGING",
    firebaseConfig,
  });

  const messaging = getMessaging(app);

  if (!foregroundListenerBound) {
    onMessage(messaging, (payload: { notification?: { title?: string; body?: string } }) => {
      toast.info(
        payload.notification?.title ?? "Новая операция",
        {
          description:
            payload.notification?.body ??
            "Поступило push-уведомление по операциям.",
        }
      );

      enqueueTelemetry({
        type: "push",
        service: "firebase-push",
        state: "foreground-message",
        message: payload.notification?.title ?? "Foreground push received.",
      });
    });

    foregroundListenerBound = true;
  }

  const pushToken = await getToken(messaging, {
    vapidKey: appEnv.firebaseVapidKey,
    serviceWorkerRegistration,
  });

  if (!pushToken) {
    enqueueTelemetry({
      type: "push",
      service: "firebase-push",
      state: "missing-token",
      message: "Firebase did not return an FCM token.",
    });
    return;
  }

  const previousToken = localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);

  if (previousToken !== pushToken) {
    try {
      await registerPushToken(pushToken);
    } catch {
      enqueueTelemetry({
        type: "push",
        service: "firebase-push",
        state: "registration-failed",
        message: "Failed to register FCM token on backend.",
      });
    }
  }

  enqueueTelemetry({
    type: "push",
    service: "firebase-push",
    state: "ready",
    message: "Firebase push scaffold initialized.",
  });

  initializedForUserId = userId;
}
