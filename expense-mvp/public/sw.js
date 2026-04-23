self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Запиши траты за сегодня";
  const options = {
    body: data.body || "Не забудь внести сегодняшние расходы.",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    data: {
      url: "/expenses/new"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
