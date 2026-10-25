// The settings and shopping list the extension and the site share.

export const DEFAULT_TRIP = { maxStores: 2, compareAnywhere: true, includeSimilar: false };

export const DEFAULT_SETTINGS = { postal: null, stores: [], trip: DEFAULT_TRIP };

// `notAt` maps an item to the stores you don't want to buy it at. `wrong` maps
// a search to flyer items it found that aren't what you meant ("peameal bacon"
// when you searched for bacon).
export const EMPTY_LIST = { recipes: [], extras: [], checked: [], removed: [], notAt: {}, wrong: {} };

export function normalizeTrip(trip) {
  const maxStores = Number(trip?.maxStores);
  return {
    maxStores: maxStores >= 1 && maxStores <= 3 ? Math.round(maxStores) : DEFAULT_TRIP.maxStores,
    compareAnywhere: trip?.compareAnywhere ?? DEFAULT_TRIP.compareAnywhere,
    includeSimilar: trip?.includeSimilar ?? DEFAULT_TRIP.includeSimilar,
  };
}

export function normalizeList(list) {
  return {
    recipes: Array.isArray(list?.recipes) ? list.recipes : [],
    extras: Array.isArray(list?.extras) ? list.extras : [],
    checked: Array.isArray(list?.checked) ? list.checked : [],
    removed: Array.isArray(list?.removed) ? list.removed : [],
    notAt: normalizeLists(list?.notAt),
    wrong: normalizeLists(list?.wrong),
  };
}

function normalizeLists(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value)
    .map(([key, stores]) => [key, Array.isArray(stores) ? stores.filter((store) => typeof store === "string") : []])
    .filter(([, stores]) => stores.length > 0);
  return Object.fromEntries(entries);
}

/** Remembers that a flyer item isn't what a search was for. */
export function markWrong(list, term, name) {
  const names = list.wrong?.[term] ?? [];
  return { ...list, wrong: { ...list.wrong, [term]: [...new Set([...names, name])] } };
}

/** Brings back every flyer item marked wrong for a search. */
export function clearWrong(list, term) {
  const { [term]: _, ...wrong } = list.wrong ?? {};
  return { ...list, wrong };
}

/** Deals for a search, leaving out the ones marked as the wrong item. */
export function withoutWrong(deals, wrong, term) {
  const names = wrong?.[term];
  return names?.length ? deals.filter((deal) => !names.includes(deal.name)) : deals;
}

export function recipeId(url) {
  return String(url).replace(/[?#].*$/, "").replace(/\/+$/, "");
}

/** Adds a recipe, replacing an earlier copy of the same page. */
export function addRecipe(list, recipe) {
  const id = recipeId(recipe.url);
  const entry = {
    id,
    title: recipe.title,
    url: recipe.url,
    site: recipe.site,
    imageUrl: recipe.imageUrl ?? null,
    ingredients: recipe.ingredients,
    addedAt: new Date().toISOString(),
  };
  return { ...list, recipes: [...list.recipes.filter((r) => r.id !== id), entry] };
}

/** Bridge messages between Flyerwatch pages and the extension's content script. */
export const BRIDGE = {
  page: "flyerwatch-page",
  extension: "flyerwatch-extension",
};
