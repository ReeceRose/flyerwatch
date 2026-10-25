// The settings and shopping list the extension and the site share.

export const DEFAULT_TRIP = { maxStores: 2, compareAnywhere: true, includeSimilar: false };

export const DEFAULT_SETTINGS = { postal: null, stores: [], trip: DEFAULT_TRIP };

// `notAt` maps an item to the stores you don't want to buy it at.
export const EMPTY_LIST = { recipes: [], extras: [], checked: [], removed: [], notAt: {} };

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
    notAt: normalizeNotAt(list?.notAt),
  };
}

function normalizeNotAt(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value)
    .map(([key, stores]) => [key, Array.isArray(stores) ? stores.filter((store) => typeof store === "string") : []])
    .filter(([, stores]) => stores.length > 0);
  return Object.fromEntries(entries);
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
