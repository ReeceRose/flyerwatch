// Runs on Flyerwatch pages so the site can read and change the settings,
// pantry and shopping list kept in the extension. Content scripts can't be
// modules, so this file stays self-contained.
(() => {
  // A bridge left over from before the extension was reloaded or updated can
  // no longer reach chrome.storage, so it steps aside for this one.
  // The first version set the flag to `true` rather than an object, so check.
  const previous = window.__flyerwatchBridge;
  if (typeof previous?.stop === "function") previous.stop();

  const PAGE = "flyerwatch-page";
  const EXTENSION = "flyerwatch-extension";
  const POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;
  // Chrome's site access can't tell ports apart, so this also runs on other
  // apps on the same host. Only the exact Flyerwatch address gets an answer.
  const allowed = chrome.storage.sync
    .get({ flyerwatchUrl: "http://localhost:3000" })
    .then(({ flyerwatchUrl }) => {
      try {
        return new URL(flyerwatchUrl).origin === location.origin;
      } catch {
        return false;
      }
    })
    .catch(() => false);
  // chrome.storage.sync allows 8 KB per setting; the list lives in local storage.
  const MAX_TRIP = 4_000;
  const MAX_LIST = 1_000_000;

  const tooBig = (value, limit) => JSON.stringify(value).length > limit;

  const post = (message) => window.postMessage({ source: EXTENSION, ...message }, location.origin);

  const isStringList = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");

  async function readState() {
    const [sync, local] = await Promise.all([
      chrome.storage.sync.get(["postal", "stores", "trip"]),
      chrome.storage.local.get(["pantry", "list"]),
    ]);
    return {
      settings: { postal: sync.postal ?? null, stores: sync.stores ?? [], trip: sync.trip ?? null },
      pantry: local.pantry ?? [],
      list: local.list ?? null,
    };
  }

  const handlers = {
    hello: async () => ({ version: chrome.runtime.getManifest().version }),
    getState: readState,
    setSettings: async (payload) => {
      const update = {};
      if (payload.postal === null || (typeof payload.postal === "string" && POSTAL.test(payload.postal))) {
        update.postal = payload.postal;
      }
      if (isStringList(payload.stores)) update.stores = payload.stores;
      if (payload.trip && typeof payload.trip === "object" && !Array.isArray(payload.trip)) {
        if (tooBig(payload.trip, MAX_TRIP)) throw new Error("Trip settings are too big");
        update.trip = payload.trip;
      }
      await chrome.storage.sync.set(update);
      return readState();
    },
    setPantry: async (payload) => {
      if (!isStringList(payload)) throw new Error("Pantry must be a list of words");
      if (tooBig(payload, MAX_LIST)) throw new Error("Pantry is too big");
      await chrome.storage.local.set({ pantry: payload });
      return readState();
    },
    setList: async (payload) => {
      if (!payload || !Array.isArray(payload.recipes)) throw new Error("List is missing its recipes");
      if (tooBig(payload, MAX_LIST)) throw new Error("List is too big");
      await chrome.storage.local.set({ list: payload });
      return readState();
    },
  };

  async function onMessage(event) {
    if (event.source !== window || event.data?.source !== PAGE) return;
    // The extension was reloaded or removed: stay quiet so the site falls back
    // to its own storage, or a fresh bridge answers instead.
    if (!chrome.runtime?.id) return stop();
    const { id, type, payload } = event.data;
    const handler = Object.hasOwn(handlers, type) ? handlers[type] : null;
    if (!handler || !(await allowed)) return;
    try {
      post({ id, ok: true, result: await handler(payload ?? {}) });
    } catch (error) {
      post({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  async function onStorageChanged(changes) {
    const keys = ["postal", "stores", "trip", "pantry", "list"];
    if (keys.some((key) => key in changes) && (await allowed)) post({ type: "changed", result: await readState() });
  }

  function stop() {
    window.removeEventListener("message", onMessage);
    try {
      chrome.storage.onChanged.removeListener(onStorageChanged);
    } catch {
      // The old extension context is already gone.
    }
  }

  window.addEventListener("message", onMessage);
  chrome.storage.onChanged.addListener(onStorageChanged);
  window.__flyerwatchBridge = { stop };

  allowed.then((ok) => ok && post({ type: "ready" }));
})();
