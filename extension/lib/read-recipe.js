// Runs inside the recipe page through chrome.scripting.executeScript, so it
// must stay self-contained: no imports and no references to outer scope.
export function readRecipeFromPage() {
  const MAX_DEPTH = 6;

  const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

  const hasType = (node, type) => {
    const value = node["@type"];
    if (typeof value === "string") return value === type || value.endsWith(`/${type}`);
    return Array.isArray(value) && value.some((item) => item === type);
  };

  const findRecipe = (value, depth) => {
    if (depth > MAX_DEPTH) return null;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findRecipe(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (!isObject(value)) return null;
    if (hasType(value, "Recipe")) return value;
    for (const key of ["@graph", "mainEntity", "mainEntityOfPage", "itemListElement"]) {
      if (value[key] !== undefined) {
        const found = findRecipe(value[key], depth + 1);
        if (found) return found;
      }
    }
    return null;
  };

  const plain = (html) => {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  };

  const readText = (value) => {
    if (typeof value === "string") return plain(value) || null;
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const text = readText(item);
        if (text) return text;
      }
      return null;
    }
    if (isObject(value)) return readText(value.name ?? value["@value"] ?? value.text);
    return null;
  };

  const readList = (value) => {
    if (value === undefined || value === null) return [];
    if (typeof value === "string") {
      return value
        .split(/\n+/)
        .map(plain)
        .filter(Boolean);
    }
    if (Array.isArray(value)) return value.flatMap(readList);
    const text = readText(value);
    return text ? [text] : [];
  };

  const readImage = (value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(readImage).find(Boolean) ?? null;
    if (isObject(value)) return readImage(value.url ?? value.contentUrl);
    return null;
  };

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    let data;
    try {
      data = JSON.parse(script.textContent ?? "");
    } catch {
      continue;
    }
    const recipe = findRecipe(data, 0);
    if (!recipe) continue;

    const ingredients = readList(recipe.recipeIngredient ?? recipe.ingredients);
    if (ingredients.length === 0) continue;

    return {
      title: readText(recipe.name) ?? document.title,
      ingredients,
      imageUrl: readImage(recipe.image ?? recipe.thumbnailUrl),
      site: location.hostname.replace(/^www\./, ""),
      url: location.href,
    };
  }

  return null;
}
