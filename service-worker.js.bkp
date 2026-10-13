
const CACHE_NAME = "controle-producao-shell-v4";

const APP_SHELL = [
  "./",
  "./index.html",
  "./lider.html",
  "./supervisor.html",
  "./style.css",
  "./scripts.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/service-worker.js")) return;

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);

    if (response && response.ok) {
      const copy = response.clone();

      caches.open(CACHE_NAME)
        .then((cache) => cache.put(request, copy))
        .catch(() => {});
    }

    return response;
  } catch (error) {
    const cached = await caches.match(request);

    if (cached) return cached;

    if (request.mode === "navigate") {
      return caches.match("./index.html");
    }

    throw error;
  }
}

/* RECEBIMENTO DE NOTIFICAÇÕES PUSH */
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};

    try {
      if (event.data) {
        payload = event.data.json();
      }
    } catch {
      payload = {
        title: "Controle de Produção",
        body: event.data?.text() || "Você tem uma nova notificação."
      };
    }

    const title = payload.title || "Controle de Produção";

    const options = {
      body: payload.body || "Há uma atualização no sistema.",
      icon: new URL("./icons/icon-192.png", self.registration.scope).href,
      badge: new URL("./icons/icon-192.png", self.registration.scope).href,
      tag: payload.tag || "controle-producao",
      renotify: Boolean(payload.renotify),
      data: {
        url: payload.url || "./index.html"
      }
    };

    await self.registration.showNotification(title, options);
  })());
});

/* ABERTURA DA TELA INDICADA AO TOCAR NO AVISO */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const targetUrl = new URL(
      event.notification.data?.url || "./index.html",
      self.registration.scope
    ).href;

    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (const client of windows) {
      if ("focus" in client && client.url.startsWith(self.registration.scope)) {
        await client.focus();

        if ("navigate" in client && client.url !== targetUrl) {
          await client.navigate(targetUrl);
        }

        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});
