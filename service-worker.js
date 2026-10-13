
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

// =========================================================
// INSTALAÇÃO E CACHE OFFLINE
// =========================================================

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

// =========================================================
// REQUISIÇÕES E FUNCIONAMENTO OFFLINE
// =========================================================

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

// =========================================================
// RECEBIMENTO DE NOTIFICAÇÕES WEB PUSH
// =========================================================

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};

    if (event.data) {
      try {
        payload = event.data.json();
      } catch (error) {
        payload = {
          body: event.data.text()
        };
      }
    }

    const title =
      typeof payload.title === "string" && payload.title.trim()
        ? payload.title
        : "Controle de Produção";

    const body =
      typeof payload.body === "string" && payload.body.trim()
        ? payload.body
        : "Você tem uma nova notificação.";

    const targetUrl = getSafeNotificationUrl(payload.url);

    const options = {
      body,
      icon: new URL("./icons/icon-192.png", self.registration.scope).href,
      badge: new URL("./icons/icon-192.png", self.registration.scope).href,
      tag: typeof payload.tag === "string"
        ? payload.tag
        : "controle-producao",
      data: {
        url: targetUrl
      }
    };

    if (typeof payload.image === "string") {
      try {
        const imageUrl = new URL(payload.image, self.registration.scope);

        if (imageUrl.origin === self.location.origin) {
          options.image = imageUrl.href;
        }
      } catch (error) {
        // Ignora imagens com URL inválida.
      }
    }

    await self.registration.showNotification(title, options);
  })());
});

// =========================================================
// ABRIR O APLICATIVO AO CLICAR NA NOTIFICAÇÃO
// =========================================================

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const targetUrl = getSafeNotificationUrl(
      event.notification.data?.url
    );

    const target = new URL(targetUrl);

    const windowClients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (const client of windowClients) {
      if (new URL(client.url).origin !== target.origin) {
        continue;
      }

      try {
        if (client.url !== target.href && client.navigate) {
          await client.navigate(target.href);
        }

        return await client.focus();
      } catch (error) {
        // Tenta outra janela ou abre uma nova abaixo.
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(target.href);
    }
  })());
});

// =========================================================
// VALIDAR O DESTINO DA NOTIFICAÇÃO
// =========================================================

function getSafeNotificationUrl(value) {
  const fallback = new URL("./lider.html", self.registration.scope).href;

  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  try {
    const url = new URL(value, self.registration.scope);
    const scope = new URL(self.registration.scope);

    // Só permite páginas do próprio aplicativo.
    if (url.origin !== scope.origin) {
      return fallback;
    }

    if (!url.pathname.startsWith(scope.pathname)) {
      return fallback;
    }

    return url.href;
  } catch (error) {
    return fallback;
  }
}
