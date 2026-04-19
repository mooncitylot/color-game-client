// Service Worker for ColorZap - Push Notifications Support
const CACHE_NAME = "colorzap-cache-v1";
const PUSH_NOTIFICATION_ICON = "/icons/icon.svg";

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/icons/icon.svg",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
      ]);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    }),
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "ColorZap",
        body: event.data.text(),
      };
    }
  }

  const title = data.title || "ColorZap";
  const options = {
    body: data.body || "New notification from ColorZap",
    icon: data.icon || PUSH_NOTIFICATION_ICON,
    badge: data.icon || PUSH_NOTIFICATION_ICON,
    vibrate: [100, 50, 100],
    data: data.data || {},
    tag: data.tag || "colorzap-notification",
    renotify: true,
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icons/icon.svg",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event.action);
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Handle 'view' action or default click
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
  );
});

// Message event - handle messages from the main app
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_REGISTRATION") {
    event.ports[0].postMessage({
      registration: {
        active: !!self.registration.active,
        scope: self.registration.scope,
      },
    });
  }
});
