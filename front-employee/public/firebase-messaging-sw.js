self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_FIREBASE_MESSAGING") {
    self.__firebaseConfig = event.data.firebaseConfig;
  }
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() ?? {};
  const title = payload.notification?.title ?? "Новая операция";
  const options = {
    body:
      payload.notification?.body ??
      "Поступило push-уведомление по операциям.",
    data: payload.data ?? {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(
      event.notification.data?.url ?? "/"
    )
  );
});
