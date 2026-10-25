import { originPattern } from "./lib/storage.js";

const BRIDGE_ID = "flyerwatch-bridge";

// Runs bridge.js on the Flyerwatch address from settings, once Chrome has
// allowed the extension on that site.
async function syncBridge() {
  const { flyerwatchUrl } = await chrome.storage.sync.get({ flyerwatchUrl: "http://localhost:3000" });
  const pattern = flyerwatchUrl ? originPattern(flyerwatchUrl) : null;
  const allowed = pattern ? await chrome.permissions.contains({ origins: [pattern] }) : false;

  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [BRIDGE_ID] });
  if (existing.length > 0) await chrome.scripting.unregisterContentScripts({ ids: [BRIDGE_ID] });
  if (!allowed) return;

  await chrome.scripting.registerContentScripts([
    {
      id: BRIDGE_ID,
      matches: [pattern],
      js: ["bridge.js"],
      runAt: "document_start",
      persistAcrossSessions: true,
    },
  ]);

  // Pages opened before the permission was granted get the bridge now.
  const tabs = await chrome.tabs.query({ url: pattern });
  await Promise.all(
    tabs.map((tab) =>
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["bridge.js"] }).catch(() => null),
    ),
  );
}

chrome.runtime.onInstalled.addListener(syncBridge);
chrome.runtime.onStartup.addListener(syncBridge);
chrome.permissions.onAdded.addListener(syncBridge);
chrome.permissions.onRemoved.addListener(syncBridge);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.flyerwatchUrl) syncBridge();
});
