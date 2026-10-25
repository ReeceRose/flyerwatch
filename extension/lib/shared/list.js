// Turns saved recipes into one shopping list. Shared by the site and the extension.
import { toSearchTerm } from "./ingredients.js";
import { pantryMatch } from "./pantry.js";
import { combineAmounts } from "./planner.js";

/**
 * One item per search word across every recipe, plus extras typed by hand.
 * Items in the pantry or on the always-skipped list come back with a `skipped` reason.
 */
export function buildItems(recipes, extras, pantry) {
  const items = new Map();

  const add = (line, source) => {
    const parsed = toSearchTerm(line);
    const reason = parsed.skipped ? "staple" : pantryMatch(parsed.term, pantry) ? "pantry" : null;
    const key = parsed.term || line.toLowerCase();
    const item = items.get(key) ?? { key, term: parsed.term, skipped: reason, uses: [], amounts: [] };
    item.uses.push({ source, line, amount: parsed.amountText });
    item.amounts.push({ quantity: parsed.quantity, unit: parsed.unit });
    items.set(key, item);
  };

  for (const recipe of recipes) for (const line of recipe.ingredients) add(line, recipe.title);
  for (const extra of extras) add(extra, null);

  return [...items.values()].map((item) => ({
    ...item,
    sources: [...new Set(item.uses.map((use) => use.source).filter(Boolean))],
    amount: combineAmounts(item.amounts),
  }));
}

/**
 * How much of an item to buy and what it's for, as one line:
 * "4 cups for Potato Soup, 1 cup for Chowder". Null when there's nothing to say.
 */
export function describeNeed(item) {
  const parts = item.uses.map((use) =>
    use.amount && use.source ? `${use.amount} for ${use.source}` : use.amount || (use.source ? `for ${use.source}` : null),
  );
  const text = [...new Set(parts.filter(Boolean))].join(", ");
  return text ? text[0].toUpperCase() + text.slice(1) : null;
}
