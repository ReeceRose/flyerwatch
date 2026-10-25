// Runs on Flyerwatch pages so the site can read and change the settings,
// pantry and shopping list kept in the extension. Content scripts can't be
// modules, so this file stays self-contained.
(() => {
  if (window.__flyerwatchBridge) return;
  window.__flyerwatchBridge = true;

  const PAGE = "flyerwatch-page";
  const EXTENSION = "flyerwatch-extension";
  const POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;

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
      if (payload.trip && typeof payload.trip === "object") update.trip = payload.trip;
      await chrome.storage.sync.set(update);
      return readState();
    },
    setPantry: async (payload) => {
      if (!isStringList(payload)) throw new Error("Pantry must be a list of words");
      await chrome.storage.local.set({ pantry: payload });
      return readState();
    },
    setList: async (payload) => {
      if (!payload || !Array.isArray(payload.recipes)) throw new Error("List is missing its recipes");
      await chrome.storage.local.set({ list: payload });
      return readState();
    },
  };

  window.addEventListener("message", async (event) => {
    if (event.source !== window || event.data?.source !== PAGE) return;
    const { id, type, payload } = event.data;
    const handler = handlers[type];
    if (!handler) return;
    try {
      post({ id, ok: true, result: await handler(payload ?? {}) });
    } catch (error) {
      post({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  chrome.storage.onChanged.addListener(async (changes) => {
    const keys = ["postal", "stores", "trip", "pantry", "list"];
    if (keys.some((key) => key in changes)) post({ type: "changed", result: await readState() });
  });

  post({ type: "ready" });
})();
