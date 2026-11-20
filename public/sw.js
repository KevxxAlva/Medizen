// Medizen PWA Service Worker — Offline-First Edition
const CACHE_NAME = "medizen-cache-v6";
const APP_SHELL_KEY = "/__medizen_app_shell__";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/favicon-dark.svg",
  "/favicon-light.svg",
];

self.addEventListener("install", (event) => {
  const isLocalhost =
    self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";

  if (!isLocalhost) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)));
      }),
    );
  }
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const isLocalhost =
    self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (isLocalhost || name !== CACHE_NAME) {
              return caches.delete(name);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Background Sync: cuando el dispositivo recupera internet, avisar a las pestañas activas
self.addEventListener("sync", (event) => {
  if (event.tag === "medizen-offline-sync") {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "MEDIZEN_TRIGGER_SYNC" });
        }
      }),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept dev server (localhost), Vite modules, Supabase API, Auth calls, or Realtime streams
  if (
    event.request.method !== "GET" ||
    !url.protocol.startsWith("http") ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/realtime/") ||
    url.pathname.startsWith("/storage/")
  ) {
    return;
  }

  // Immutable hashed build bundles (/assets/*), Google Fonts, or static media: Cache First
  const isImmutableAsset =
    url.pathname.startsWith("/assets/") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2");

  if (isImmutableAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const contentType = response.headers.get("content-type") || "";
          const isHtmlFallback =
            url.pathname.startsWith("/assets/") && contentType.includes("text/html");
          if (response && response.status === 200 && !isHtmlFallback) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // HTML navigations and app shell scripts: Network First with cache update & offline shell fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin
        ) {
          const cloneForRequest = networkResponse.clone();
          const cloneForShell = event.request.mode === "navigate" ? networkResponse.clone() : null;
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloneForRequest);
            if (cloneForShell) {
              cache.put(APP_SHELL_KEY, cloneForShell);
            }
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then(async (cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            const shell =
              (await caches.match(APP_SHELL_KEY)) ||
              (await caches.match("/dashboard")) ||
              (await caches.match("/"));
            if (shell) return shell;
          }
          return new Response("Sin conexión a Internet", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain; charset=utf-8" }),
          });
        });
      }),
  );
});
