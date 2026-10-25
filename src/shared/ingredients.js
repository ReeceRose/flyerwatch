// Turns recipe ingredient lines into flyer search words. Shared by the
// Flyerwatch site and the extension (copied by scripts/sync-extension.mjs).
// Quantity and unit patterns are ported from Tastebase's recipe-text-helpers.ts.
const FRACTIONS = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞";
const SINGLE_QUANTITY = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\s*[${FRACTIONS}]|\\d+\\/\\d+|[${FRACTIONS}]|\\d+(?:[.,]\\d+)?)`;
const QUANTITY = new RegExp(
  `^(${SINGLE_QUANTITY}(?:\\s*(?:-|–|—|to)\\s*${SINGLE_QUANTITY})?)(?=\\s|[a-zA-Z(]|$)\\s*`,
);

const UNIT_NAMES = [
  "fluid ounces", "fluid ounce", "tablespoons", "tablespoon", "teaspoons", "teaspoon",
  "kilograms", "kilogram", "milliliters", "milliliter", "millilitres", "millilitre",
  "packages", "package", "handfuls", "handful", "bunches", "bunch", "cloves", "clove",
  "ounces", "ounce", "pounds", "pound", "quarts", "quart", "liters", "liter", "litres",
  "litre", "pinches", "pinch", "dashes", "dash", "slices", "slice", "sticks", "stick",
  "sprigs", "sprig", "grams", "gram", "pints", "pint", "cans", "can", "cups", "cup",
  "heads", "head", "jars", "jar", "bags", "bag", "boxes", "box", "pieces", "piece",
  "tbsp", "tbs", "tbl", "tsp", "fl oz", "lbs", "lb", "oz", "kg", "ml", "qt", "pt", "g", "l",
];
const UNIT = new RegExp(
  `^(${UNIT_NAMES.map((unit) => unit.replace(" ", "\\s+")).join("|")})\\.?(?=\\s|$|,|\\/)\\s*(?:of\\s+)?`,
  "i",
);

const LIST_MARKER = /^(?:[-*•·▪▢☐□◦‣⁃]+\s*|(?:step\s*)?\d+\s*[.):]\s+|\(\d+\)\s+)/i;

const DESCRIPTORS = new Set([
  "a", "an", "about", "approximately", "large", "medium", "small", "extra", "jumbo",
  "fresh", "freshly", "finely", "roughly", "coarsely", "thinly", "thickly", "chopped",
  "diced", "minced", "sliced", "grated", "shredded", "peeled", "seeded", "deseeded",
  "cored", "trimmed", "halved", "quartered", "crushed", "cubed", "julienned", "softened",
  "melted", "cold", "warm", "hot", "packed", "heaping", "level", "divided", "optional",
  "good", "quality", "good-quality", "homemade", "store-bought", "organic", "boneless",
  "skinless", "ripe", "uncooked", "cooked", "raw", "loosely", "lightly", "well", "plus",
  "more", "room", "temperature", "whole", "pure", "unsalted", "salted", "rinsed",
  "drained", "to", "taste", "serve", "garnish", "if", "needed", "desired", "each",
]);

const STAPLES = new Set([
  "salt", "pepper", "black pepper", "white pepper", "kosher salt", "sea salt",
  "salt and pepper", "salt and black pepper", "water", "ice", "ice water",
  "boiling water", "cooking spray", "nonstick spray", "nonstick cooking spray",
  "diamond crystal", "morton", "table salt", "fine salt", "flaky salt", "flaky sea salt",
]);

const FRACTION_VALUES = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75, "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8, "⅙": 1 / 6, "⅚": 5 / 6, "⅐": 1 / 7, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };

function parseSingle(text) {
  const parts = text.trim().split(/\s+/);
  let total = 0;
  for (const part of parts) {
    const unicode = part.match(new RegExp(`^(\\d*)([${FRACTIONS}])$`));
    if (unicode) total += (unicode[1] ? Number(unicode[1]) : 0) + FRACTION_VALUES[unicode[2]];
    else if (/^\d+\/\d+$/.test(part)) {
      const [top, bottom] = part.split("/").map(Number);
      total += bottom ? top / bottom : 0;
    } else total += Number(part.replace(",", ".")) || 0;
  }
  return total;
}

// The larger end of a range, since that's what you'd buy for.
function parseQuantity(text) {
  const ends = text.split(/\s*(?:-|–|—|to)\s*/).map(parseSingle).filter((n) => n > 0);
  return ends.length ? Math.max(...ends) : null;
}

const UNIT_KINDS = [
  [/^(lb|lbs|pound|pounds)$/i, "lb"],
  [/^(oz|ounce|ounces)$/i, "oz"],
  [/^(g|gram|grams)$/i, "g"],
  [/^(kg|kilogram|kilograms)$/i, "kg"],
];

function unitKind(unit) {
  const clean = unit.replace(/\.$/, "").replace(/\s+/g, " ");
  for (const [pattern, kind] of UNIT_KINDS) if (pattern.test(clean)) return kind;
  return "other";
}

// Removes leading amounts, including pairs like "600g / 1.2lb" and "1 cup plus 1 tbsp".
// The first amount is kept so prices can be estimated.
function stripAmounts(text) {
  let rest = text;
  let quantity = null;
  let unit = null;
  for (let pass = 0; pass < 3; pass++) {
    const before = rest;
    if (pass > 0) rest = rest.replace(/^(?:\/|\+|plus\s|minus\s|less\s)\s*/i, "");
    const amount = rest.match(QUANTITY);
    if (amount) rest = rest.slice(amount[0].length);
    rest = rest.replace(/^x\s+/i, "").replace(/^\([^)]*\)\s*/, "");
    const unitMatch = rest.match(UNIT);
    if (unitMatch && rest.length > unitMatch[0].length) rest = rest.slice(unitMatch[0].length);
    if (pass === 0 && amount) {
      quantity = parseQuantity(amount[1]);
      unit = unitMatch ? unitKind(unitMatch[1]) : null;
    }
    if (pass > 0 && !amount) return { rest: before, quantity, unit };
    if (rest === before) break;
  }
  return { rest, quantity, unit };
}

const TRAILING_PARTS = new Set(["clove", "cloves", "stalk", "stalks", "sprig", "sprigs", "leaf", "leaves", "head", "heads", "florets"]);

function cleanWords(text) {
  const words = text
    .split(/\s+/)
    .map((word) => word.replace(/^[^a-zà-ÿ0-9]+|[^a-zà-ÿ0-9]+$/g, ""))
    .filter((word) => word && !/^\d/.test(word) && !DESCRIPTORS.has(word));
  if (words.length > 1 && words[0] !== "bay" && TRAILING_PARTS.has(words.at(-1))) words.pop();
  return words
    .join(" ")
    .replace(/^egg yolks?$/, "eggs")
    .trim();
}

function normalize(text) {
  return text
    .replace(/[   ]/g, " ")
    .replace(/⁄/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

export function toSearchTerm(line) {
  let rest = normalize(line).replace(LIST_MARKER, "");

  const amount = stripAmounts(rest);
  rest = amount.rest;

  const cleaned = rest
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .toLowerCase()
    .replace(/[*†‡]/g, "")
    .replace(/^(?:the\s+)?(?:zest\s+and\s+juice|juice\s+and\s+zest|juice|zest)\s+of\s+(?:\d+\s+|an?\s+)?/, "");

  let term = "";
  for (const segment of cleaned.split(/,|;| - | – | — /)) {
    const head = segment
      .split(/\b(?:or|for|such as|like|to taste|at room temperature|plus more)\b/)[0]
      .replace(/\band\/or\b.*$/, "");
    term = cleanWords(head);
    if (term) break;
  }

  const staple = term
    .split(/\s+and\s+|\s*&\s*/)
    .every((part) => STAPLES.has(part) || STAPLES.has(part.replace(/^(ground|cracked)\s+/, "")));

  return {
    line,
    term,
    skipped: term.length < 2 || staple,
    quantity: amount.quantity,
    unit: amount.unit,
  };
}
