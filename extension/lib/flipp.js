const BASE = "https://backflipp.wishabi.com/flipp";
const CACHE_HOURS = 6;
const CACHE_PREFIX = "flipp:";

function https(url) {
  return url ? url.replace(/^http:\/\//, "https://") : null;
}

function money(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function text(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

const fresh = (stored) => stored && Date.now() - stored.at < CACHE_HOURS * 3600 * 1000;

// Removes expired results so the cache doesn't fill local storage, which also
// holds the pantry and shopping list. Runs once each time the popup opens.
let pruned = null;
export function pruneCache() {
  pruned ??= chrome.storage.local
    .get(null)
    .then((all) => {
      const expired = Object.keys(all).filter((key) => key.startsWith(CACHE_PREFIX) && !fresh(all[key]));
      return expired.length > 0 ? chrome.storage.local.remove(expired) : undefined;
    })
    .catch(() => {
      pruned = null;
    });
  return pruned;
}

async function cached(key, load) {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const stored = (await chrome.storage.local.get(cacheKey))[cacheKey];
  if (fresh(stored)) return stored.value;

  const value = await load();
  try {
    await pruneCache();
    await chrome.storage.local.set({ [cacheKey]: { at: Date.now(), value } });
  } catch {
    // Not caching a result is fine; the search still worked.
  }
  return value;
}

async function get(path, params) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("locale", "en-ca");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Flipp responded ${res.status}`);
  return res.json();
}

export function getGroceryFlyers(postal) {
  return cached(`flyers:${postal}`, async () => {
    const data = await get("/flyers", { postal_code: postal });
    return data.flyers
      .filter((flyer) => (flyer.categories ?? []).includes("Groceries"))
      .map((flyer) => ({
        id: flyer.id,
        merchant: flyer.merchant.trim(),
        validTo: flyer.valid_to,
      }));
  });
}

export async function getGroceryStores(postal) {
  const flyers = await getGroceryFlyers(postal);
  return [...new Set(flyers.map((flyer) => flyer.merchant))].sort((a, b) => a.localeCompare(b));
}

export function searchDeals(postal, term) {
  return cached(`search:${postal}:${term}`, async () => {
    const data = await get("/items/search", { postal_code: postal, q: term });
    return (data.items ?? [])
      .filter((item) => item.item_type === "flyer" && text(item.name))
      .map((item) => ({
        id: item.id,
        flyerId: item.flyer_id,
        merchant: (item.merchant_name ?? "").trim(),
        name: item.name.trim(),
        price: money(item.current_price),
        originalPrice: money(item.original_price),
        prePriceText: text(item.pre_price_text),
        postPriceText: text(item.post_price_text),
        saleStory: text(item.sale_story),
        imageUrl: https(item.clean_image_url ?? item.clipping_image_url),
        validTo: item.valid_to ?? null,
      }));
  });
}

export async function clearCache() {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter((key) => key.startsWith(CACHE_PREFIX));
  if (keys.length) await chrome.storage.local.remove(keys);
}
