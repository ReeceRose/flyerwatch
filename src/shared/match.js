// Decides which flyer deals actually match an ingredient. Shared by the site and the extension.
import { pricePerItem, pricePerLb } from "./price.js";

function stem(word) {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(oes|ches|shes|xes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function words(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length > 1)
    .map(stem);
}

// Words that can follow the ingredient without turning it into another product,
// so "eggs, 12 pack" still counts as eggs but "egg tarts" doesn't.
const HARMLESS_NEXT = new Set([
  "pack", "family", "value", "size", "club", "bag", "bunch", "each", "ea", "lb", "kg", "ml",
  "boneless", "skinless", "fresh", "frozen", "organic", "selected", "assorted", "variety",
  "product", "of", "on", "the", "in", "with", "from", "and", "large", "medium", "small", "extra",
  "grade", "count", "ct", "whole", "sliced", "pk", "per", "tray", "clamshell", "container",
  "root", "bulb", "bulbs", "head", "heads", "stalk", "stalks",
]);

/**
 * How well a deal matches: tier 0 is the ingredient itself, tier 1 names a
 * different product ("butter tart filling"). `part` is the piece of a
 * multi-product name ("mushrooms or bell peppers") that matched.
 * Returns null when it isn't a match at all.
 */
export function matchDeal(deal, term) {
  const wanted = words(term);
  if (wanted.length === 0) return null;
  if (!wanted.every((word) => words(deal.name).includes(word))) return null;

  let best = { tier: 1, part: null };
  for (const part of deal.name.split(/,|\bor\b|\bOR\b|&|\//)) {
    const have = words(part);
    if (!wanted.every((word) => have.includes(word))) continue;
    const last = Math.max(...wanted.map((word) => have.lastIndexOf(word)));
    const next = have[last + 1];
    const tier = next === undefined || HARMLESS_NEXT.has(next) ? 0 : 1;
    if (tier < best.tier || best.part === null) best = { tier, part: part.trim() };
    if (tier === 0) break;
  }
  return best;
}

export function matchTier(deal, term) {
  return matchDeal(deal, term)?.tier ?? null;
}

// "Mushrooms 227 g Product of Ontario or Sweet Green Bell Peppers 5.49/kg":
// the flyer's main price is for the first product. When the ingredient only
// appears after the first product ends (its size or "Product of"), a price
// written later in the name is the one that applies to it.
const INLINE_PRICE = /\$?\s*(\d+\.\d{2})\s*\/\s*(kg|lb|100\s*g)\b/gi;
const FIRST_PRODUCT_END = /\b\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|oz)\b|\bproduct of\b/i;

function withInlinePrice(deal, term) {
  const name = deal.name.toLowerCase();
  const end = name.search(FIRST_PRODUCT_END);
  if (end < 0) return deal;
  const termAt = Math.max(...words(term).map((word) => name.lastIndexOf(word)));
  if (termAt <= end) return deal;
  const inline = [...deal.name.matchAll(INLINE_PRICE)].find((match) => match.index > termAt);
  if (!inline) return deal;
  return {
    ...deal,
    price: Number.parseFloat(inline[1]),
    prePriceText: null,
    postPriceText: `/${inline[2].toLowerCase().replace(/\s+/g, " ")}`,
  };
}

function compare(a, b) {
  const lbA = pricePerLb(a);
  const lbB = pricePerLb(b);
  if (lbA !== null && lbB !== null) return lbA - lbB;
  if (lbA !== null) return -1;
  if (lbB !== null) return 1;

  const eachA = pricePerItem(a);
  const eachB = pricePerItem(b);
  if (eachA === null && eachB === null) return 0;
  if (eachA === null) return 1;
  if (eachB === null) return -1;
  return eachA - eachB;
}

function rankFor(deals, term, groceryFlyerIds, minTier) {
  const seen = new Set();
  return deals
    .filter((deal) => !groceryFlyerIds || groceryFlyerIds.has(deal.flyerId))
    .map((deal) => {
      const match = matchDeal(deal, term);
      if (!match) return { ...deal, tier: null };
      return { ...withInlinePrice(deal, term), tier: Math.max(match.tier, minTier) };
    })
    .filter((deal) => deal.tier !== null)
    .filter((deal) => {
      const key = `${deal.merchant}|${deal.name}|${deal.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.tier - b.tier || compare(a, b));
}

/**
 * Relevant grocery deals for one ingredient, closest and cheapest first.
 * Long terms fall back to their last two words ("dark brown sugar" to
 * "brown sugar"), marked as similar items.
 */
export function rankDeals(deals, term, groceryFlyerIds) {
  const ranked = rankFor(deals, term, groceryFlyerIds, 0);
  const parts = term.split(/\s+/);
  if (ranked.length > 0 || parts.length < 3) return ranked;
  return rankFor(deals, parts.slice(-2).join(" "), groceryFlyerIds, 1);
}

/** Which stores carry the most of the recipe's ingredients on sale. */
export function storeCoverage(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (row.skipped || !row.deals) continue;
    for (const store of new Set(row.deals.filter((deal) => deal.tier === 0).map((deal) => deal.merchant))) {
      counts.set(store, (counts.get(store) ?? 0) + 1);
    }
  }
  return [...counts].map(([store, count]) => ({ store, count }));
}
