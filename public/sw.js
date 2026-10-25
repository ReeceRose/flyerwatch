// Keeps the shared shopping list page working without signal. It only
// controls /share: the page and the files it loaded are saved the first time
// it opens, then served from here when the network is slow or gone.
const CACHE = "flyerwatch-share-v1";
const PAGE = "/share";
const NETWORK_TIMEOUT = 3000;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

async function save(request, response) {
  if (!response || !response.ok || response.type === "opaque") return response;
  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
  return response;
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

// The page: try the network briefly so updates arrive, then fall back to the saved copy.
async function page(request) {
  try {
    return await save(PAGE, await withTimeout(fetch(request), NETWORK_TIMEOUT));
  } catch {
    const saved = await caches.match(PAGE);
    if (saved) return saved;
    throw new Error("Not saved for offline use yet");
  }
}

// Built files have hashed names and never change, so the saved copy is always right.
async function asset(request) {
  const saved = await caches.match(request);
  if (saved) return saved;
  return save(request, await fetch(request));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname === PAGE) {
    event.respondWith(page(request));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(asset(request));
  }
});

// The page sends the files it already loaded, which arrived before this worker was running.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "save-share-page") return;
  const port = event.ports[0];
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const urls = [...new Set(event.data.urls)]
        .map((href) => new URL(href, self.location.origin))
        .filter((url) => url.origin === self.location.origin && url.pathname.startsWith("/_next/static/"))
        .map((url) => url.href);

      // Files from an older version of the site are no longer needed.
      const keep = new Set([...urls, new URL(PAGE, self.location.origin).href]);
      for (const request of await cache.keys()) {
        if (!keep.has(request.url)) await cache.delete(request);
      }

      await Promise.all(
        urls.map(async (href) => {
          if (await cache.match(href)) return;
          const response = await fetch(href).catch(() => null);
          if (response?.ok) await cache.put(href, response);
        }),
      );
      const pageResponse = await fetch(PAGE).catch(() => null);
      if (pageResponse?.ok) await cache.put(PAGE, pageResponse);
      port?.postMessage({ saved: Boolean(pageResponse?.ok) || Boolean(await cache.match(PAGE)) });
    })(),
  );
});
