// Estimates costs and picks which stores to visit. Shared by the site and the extension.
import { pricePerItem, pricePerLb, unitLabel } from "./price.js";

const LB = { lb: 1, oz: 1 / 16, g: 1 / 453.592, kg: 2.20462 };

/** Combines the amounts of the same ingredient from different recipes. */
export function combineAmounts(amounts) {
  const known = amounts.filter((a) => a.quantity !== null);
  if (known.length === 0) return { quantity: null, unit: null };
  if (known.every((a) => a.unit in LB)) {
    return { quantity: known.reduce((sum, a) => sum + a.quantity * LB[a.unit], 0), unit: "lb" };
  }
  if (known.every((a) => a.unit === null)) {
    return { quantity: known.reduce((sum, a) => sum + a.quantity, 0), unit: null };
  }
  return { quantity: null, unit: "other" };
}

const PACK_COUNT = /\b(\d+)\s*(?:'?s|pk|pack|ct|count|pieces|pcs)\b/i;
const PACK_SIZE = /\b\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|lb|lbs|oz)\b|\b(?:bag|box|case|tray|jar|bottle|tub|bunch)\b/i;

/**
 * How many of a deal to buy for a counted amount ("8 tortillas", "3 peppers").
 * Loose items multiply; a 12-pack covers up to 12; anything sold by size is one.
 */
export function packagesNeeded(deal, amount) {
  if (amount.unit !== null || !amount.quantity) return 1;
  const pack = deal.name.match(PACK_COUNT);
  if (pack) return Math.max(1, Math.ceil(amount.quantity / Number(pack[1])));
  if (PACK_SIZE.test(deal.name)) return 1;
  return Math.ceil(amount.quantity);
}

// Rough weights of one item, for flyer prices by the pound when a recipe
// counts things ("3 bell peppers") instead of weighing them.
const TYPICAL_LB = [
  [/\bbell peppers?\b|\bpeppers?\b/, 0.44],
  [/\bsweet potato(es)?\b/, 0.6],
  [/\bpotato(es)?\b/, 0.5],
  [/\bonions?\b/, 0.5],
  [/\btomato(es)?\b/, 0.33],
  [/\bzucchinis?\b|\bcucumbers?\b/, 0.6],
  [/\bapples?\b|\bpears?\b|\bpeach(es)?\b|\bavocados?\b/, 0.4],
  [/\blemons?\b|\blimes?\b|\boranges?\b|\bbananas?\b/, 0.3],
  [/\bcarrots?\b/, 0.15],
  [/\bchicken breasts?\b|\bpork chops?\b|\bsteaks?\b/, 0.5],
  [/\bchicken thighs?\b|\bsausages?\b/, 0.3],
  [/\bchicken drumsticks?\b|\bchicken wings?\b/, 0.2],
];

function typicalWeight(term) {
  return TYPICAL_LB.find(([pattern]) => pattern.test(term ?? ""))?.[1] ?? null;
}

function roundWeight(lb) {
  return Math.round(lb * 10) / 10;
}

/**
 * Roughly what this deal costs for the amount a recipe needs.
 * Weighed items use the recipe's weight, a typical weight for counted items,
 * or 1 lb; the last two are guesses and say what they assumed.
 * Counted items multiply only when sold loose; packs and sized items count once.
 */
export function estimateCost(deal, amount, term = "") {
  if (deal.price === null) return null;
  const label = unitLabel(deal.postPriceText);
  const perLb = pricePerLb(deal);

  if (perLb !== null && (label === "/lb" || label === "/kg" || label === "/100 g")) {
    if (amount.quantity !== null && amount.unit in LB) {
      return { amount: amount.quantity * LB[amount.unit] * perLb, guess: false, assumed: null };
    }
    const each = amount.unit === null && amount.quantity ? typicalWeight(term) : null;
    const lb = each ? roundWeight(Math.max(amount.quantity * each, 0.1)) : 1;
    return { amount: lb * perLb, guess: true, assumed: `${lb} lb` };
  }

  const each = pricePerItem(deal);
  if (each === null) return null;
  return { amount: each * packagesNeeded(deal, amount), guess: false, assumed: null };
}

function eligible(item, includeSimilar) {
  return item.deals.filter((deal) => deal.tier === 0 || includeSimilar);
}

function* combinations(list, size, start = 0, chosen = []) {
  if (chosen.length === size) {
    yield chosen;
    return;
  }
  for (let i = start; i <= list.length - (size - chosen.length); i++) {
    yield* combinations(list, size, i + 1, [...chosen, list[i]]);
  }
}

function evaluate(items, stores, preferred, includeSimilar) {
  const chosen = new Set(stores);
  /** @type {Record<string, any>} */
  const assignments = {};
  let covered = 0;
  let total = 0;
  let guesses = 0;
  for (const item of items) {
    const deal = eligible(item, includeSimilar).find((d) => chosen.has(d.merchant)) ?? null;
    assignments[item.key] = deal;
    if (!deal) continue;
    covered += 1;
    const cost = estimateCost(deal, item.amount, item.key);
    if (cost) {
      total += cost.amount;
      if (cost.guess) guesses += 1;
    }
  }
  const preferredCount = stores.filter((store) => preferred.has(store)).length;
  return { stores, covered, total, guesses, preferredCount, assignments };
}

function better(a, b) {
  if (!b) return true;
  if (a.covered !== b.covered) return a.covered > b.covered;
  if (a.preferredCount !== b.preferredCount) return a.preferredCount > b.preferredCount;
  return a.total < b.total;
}

const MAX_CANDIDATES = 24;

/**
 * The smallest set of up to `maxStores` stores that has the most items on sale.
 * `allowed` limits the stores considered; `preferred` breaks ties.
 * Returns null when no store has anything.
 */
export function planTrip(items, { maxStores, allowed = null, preferred = [], includeSimilar = false }) {
  const preferredSet = new Set(preferred);
  const counts = new Map();
  for (const item of items) {
    for (const store of new Set(eligible(item, includeSimilar).map((d) => d.merchant))) {
      if (allowed && !allowed.includes(store)) continue;
      counts.set(store, (counts.get(store) ?? 0) + 1);
    }
  }
  const candidates = [...counts]
    .sort((a, b) => b[1] - a[1] || Number(preferredSet.has(b[0])) - Number(preferredSet.has(a[0])))
    .slice(0, MAX_CANDIDATES)
    .map(([store]) => store);
  if (candidates.length === 0) return null;

  let best = null;
  for (let size = 1; size <= Math.min(maxStores, candidates.length); size++) {
    let bestOfSize = null;
    for (const combo of combinations(candidates, size)) {
      const plan = evaluate(items, combo, preferredSet, includeSimilar);
      if (better(plan, bestOfSize)) bestOfSize = plan;
    }
    if (!best || bestOfSize.covered > best.covered) best = bestOfSize;
  }
  return best;
}

/** Your-stores and anywhere plans; the anywhere plan only when it gets more items. */
export function planTrips(items, settings) {
  const trip = settings.trip;
  const preferred = settings.stores ?? [];
  const options = { maxStores: trip.maxStores, preferred, includeSimilar: trip.includeSimilar };
  const yours = preferred.length > 0 ? planTrip(items, { ...options, allowed: preferred }) : null;
  const anywhere =
    !yours || trip.compareAnywhere ? planTrip(items, { ...options, allowed: null }) : null;
  return {
    yours,
    anywhere: anywhere && (!yours || anywhere.covered > yours.covered) ? anywhere : null,
  };
}
