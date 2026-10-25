import { cleanPantry } from "./shared/pantry.js";
import { DEFAULT_SETTINGS, normalizeList, normalizeTrip } from "./shared/state.js";

// Settings sync across your Chrome profile; the pantry and list stay on this computer.
const SYNC_DEFAULTS = { ...DEFAULT_SETTINGS, flyerwatchUrl: "http://localhost:3000" };

const POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;

export function normalizePostal(value) {
  const code = String(value ?? "").replace(/\s+/g, "").toUpperCase();
  return POSTAL.test(code) ? code : null;
}

export async function loadSettings() {
  const stored = await chrome.storage.sync.get(Object.keys(SYNC_DEFAULTS));
  const settings = { ...SYNC_DEFAULTS, ...stored };
  return { ...settings, trip: normalizeTrip(settings.trip) };
}

export async function saveSettings(settings) {
  await chrome.storage.sync.set({
    postal: settings.postal,
    stores: settings.stores,
    trip: normalizeTrip(settings.trip),
    flyerwatchUrl: settings.flyerwatchUrl,
  });
}

export async function loadPantry() {
  return (await chrome.storage.local.get("pantry")).pantry ?? [];
}

export async function savePantry(items) {
  const pantry = cleanPantry(items);
  await chrome.storage.local.set({ pantry });
  return pantry;
}

export async function loadList() {
  return normalizeList((await chrome.storage.local.get("list")).list);
}

export async function saveList(list) {
  await chrome.storage.local.set({ list: normalizeList(list) });
}

/** The host permission pattern for a Flyerwatch address, ignoring the port. */
export function originPattern(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return /^https?:$/.test(protocol) ? `${protocol}//${hostname}/*` : null;
  } catch {
    return null;
  }
}
