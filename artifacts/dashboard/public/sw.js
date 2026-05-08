const CACHE_NAME = "axyntrax-v1";
const PRECACHE = ["/dashboard/", "/dashboard/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/dashboard/api/")) {
    return;
  }
  if (req.destination === "document") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/dashboard/"))),
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && (res.type === "basic" || res.type === "default")) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    }),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "AXYNTRAX", body: "Notificación nueva" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    if (event.data) data.body = event.data.text();
  }
  const options = {
    body: data.body,
    icon: "/dashboard/axyntrax-logo.jpeg",
    badge: "/dashboard/favicon.svg",
    tag: data.tag || "axyntrax",
    data: { url: data.url || "/dashboard/" },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/dashboard/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(target) && "focus" in w) return w.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
