import { h } from "./lib/dom.js";
import { getGroceryFlyers, searchDeals } from "./lib/flipp.js";
import { readRecipeFromPage } from "./lib/read-recipe.js";
import { formatDay, formatPostal, tidyName } from "./lib/shared/format.js";
import { toSearchTerm } from "./lib/shared/ingredients.js";
import { rankDeals, storeCoverage } from "./lib/shared/match.js";
import { pantryMatch } from "./lib/shared/pantry.js";
import { combineAmounts, planTrips } from "./lib/shared/planner.js";
import { formatMoney, multiBuyCount, pricePerLb, unitLabel } from "./lib/shared/price.js";
import { addRecipe, recipeId } from "./lib/shared/state.js";
import { loadList, loadPantry, loadSettings, originPattern, saveList, savePantry } from "./lib/storage.js";
import { connectSettings, renderSettings, renderSetup } from "./settings-view.js";

const app = document.getElementById("app");
const gear = document.getElementById("gear");
const near = document.getElementById("near");

const state = {
  settings: null,
  pantry: [],
  recipe: null,
  rows: [],
  groceryIds: new Set(),
  filter: "all",
  expanded: new Set(),
  onList: false,
};

function show(...nodes) {
  app.replaceChildren(...nodes);
}

function updateHeader() {
  const postal = state.settings?.postal;
  near.hidden = !postal;
  gear.hidden = !postal;
  near.textContent = postal ? `Near ${formatPostal(postal)}` : "";
}

function priceTag(deal) {
  if (deal.price === null) {
    return h("span", { class: "tag tag-text" }, deal.saleStory ?? "See flyer");
  }
  const [dollars, cents] = deal.price.toFixed(2).split(".");
  const count = multiBuyCount(deal.prePriceText);
  const unit = unitLabel(deal.postPriceText);
  return h(
    "span",
    { class: "tag" },
    count > 1 ? h("span", { class: "tag-for" }, `${count} for`) : null,
    h("span", { class: "tag-price" }, h("sup", {}, "$"), dollars, h("sup", {}, cents)),
    unit ? h("span", { class: "tag-unit" }, unit) : null,
  );
}

function openDeal(deal) {
  const base = state.settings.flyerwatchUrl?.replace(/\/+$/, "");
  if (!base) return;
  const postal = state.settings.postal ? `?postal=${encodeURIComponent(state.settings.postal)}` : "";
  chrome.tabs.create({ url: `${base}/flyers/${deal.flyerId}${postal}` });
}

function dealCard(deal, { compact = false } = {}) {
  const perLb = pricePerLb(deal);
  const until = formatDay(deal.validTo);
  const linked = Boolean(state.settings.flyerwatchUrl);
  return h(
    linked ? "button" : "div",
    {
      class: `deal${compact ? " deal-compact" : ""}`,
      type: linked ? "button" : null,
      title: linked ? "Open this flyer in Flyerwatch" : null,
      onclick: linked ? () => openDeal(deal) : null,
    },
    h("span", { class: "thumb" }, deal.imageUrl ? h("img", { src: deal.imageUrl, alt: "", loading: "lazy" }) : null),
    h(
      "span",
      { class: "deal-body" },
      deal.tier > 0 ? h("span", { class: "similar" }, "Similar item") : null,
      h("span", { class: "deal-name" }, tidyName(deal.name)),
      h(
        "span",
        { class: "deal-meta" },
        h("strong", {}, deal.merchant),
        until ? ` until ${until}` : null,
        perLb !== null && unitLabel(deal.postPriceText) !== "/lb" ? `, ${formatMoney(perLb)}/lb` : null,
      ),
      deal.saleStory ? h("span", { class: "sale" }, deal.saleStory) : null,
    ),
    priceTag(deal),
  );
}

function storesInFilter() {
  if (state.filter === "all") return null;
  if (state.filter === "mine") return new Set(state.settings.stores);
  return new Set([state.filter]);
}

function tidyLine(line) {
  return line
    .replace(/\(\s*,\s*/g, "(")
    .replace(/\(\(/g, "(")
    .replace(/\)\)/g, ")")
    .replace(/\s+/g, " ");
}

function sourceLines(row) {
  return h("div", { class: "lines" }, row.lines.map((line) => h("p", { class: "line" }, tidyLine(line))));
}

function buildRows(ingredients) {
  const rows = [];
  for (const line of ingredients) {
    const parsed = toSearchTerm(line);
    const reason = parsed.skipped ? "staple" : pantryMatch(parsed.term, state.pantry) ? "pantry" : null;
    const skipped = reason !== null;
    const amount = { quantity: parsed.quantity, unit: parsed.unit };
    const same = rows.find((row) => row.term === parsed.term && row.reason === reason);
    if (same) {
      same.lines.push(line);
      same.amounts.push(amount);
    } else {
      rows.push({
        lines: [line],
        amounts: [amount],
        term: parsed.term,
        skipped,
        reason,
        status: skipped ? "ready" : "loading",
        deals: null,
      });
    }
  }
  return rows;
}

function rowView(row, index) {
  const header = h(
    "div",
    { class: "row-head" },
    h("span", { class: "term" }, row.term || row.lines[0]),
    h(
      "span",
      { class: "row-links" },
      pantryMatch(row.term, state.pantry)
        ? h("button", { type: "button", class: "link", onclick: () => removeFromPantry(index) }, "Remove from pantry")
        : h(
            "button",
            { type: "button", class: "link", title: "Never search for this again", onclick: () => addToPantry(index) },
            "Add to pantry",
          ),
      h("button", { type: "button", class: "link", onclick: () => editRow(index) }, "Change search"),
    ),
  );

  if (row.editing) {
    const input = h("input", {
      type: "search",
      value: row.draft ?? row.term,
      "aria-label": "Search flyers for",
      oninput: (event) => {
        row.draft = event.target.value;
      },
    });
    const form = h(
      "form",
      {
        class: "edit",
        onsubmit: (event) => {
          event.preventDefault();
          const term = input.value.trim().toLowerCase();
          if (term) runRow(index, term);
        },
      },
      input,
      h("button", { type: "submit", class: "small-button" }, "Search"),
      h("button", { type: "button", class: "link", onclick: () => cancelEdit(index) }, "Cancel"),
    );
    queueMicrotask(() => input.focus());
    return h("li", { class: "row" }, form, sourceLines(row));
  }

  const parts = [header, sourceLines(row)];

  if (row.status === "loading") {
    parts.push(h("div", { class: "deal deal-loading", "aria-label": "Searching flyers" }));
  } else if (row.status === "failed") {
    parts.push(h("p", { class: "empty" }, "Flipp didn't answer. Close and reopen to try again."));
  } else {
    const allowed = storesInFilter();
    const inFilter = allowed ? row.deals.filter((deal) => allowed.has(deal.merchant)) : row.deals;
    if (inFilter.length > 0) {
      parts.push(dealCard(inFilter[0]));
      const rest = inFilter.slice(1, 6);
      if (rest.length > 0) {
        const open = state.expanded.has(index);
        parts.push(
          h(
            "button",
            { type: "button", class: "link more", "aria-expanded": String(open), onclick: () => toggleMore(index) },
            open ? "Hide other deals" : `${rest.length} more ${rest.length === 1 ? "deal" : "deals"}`,
          ),
        );
        if (open) parts.push(h("div", { class: "others" }, rest.map((deal) => dealCard(deal, { compact: true }))));
      }
    } else if (row.deals.some((deal) => deal.tier === 0)) {
      const elsewhere = row.deals.find((deal) => deal.tier === 0);
      parts.push(
        h("p", { class: "empty" }, state.filter === "mine" ? "Not on sale at your stores." : `Not on sale at ${state.filter}.`),
        h("p", { class: "elsewhere" }, "Cheapest elsewhere:"),
        dealCard(elsewhere, { compact: true }),
      );
    } else {
      parts.push(h("p", { class: "empty" }, "Not in any flyer this week."));
    }
  }

  return h("li", { class: "row" }, ...parts);
}

function filterChips() {
  const coverage = storeCoverage(state.rows).sort(
    (a, b) => b.count - a.count || a.store.localeCompare(b.store),
  );
  const searched = state.rows.filter((row) => !row.skipped).length;
  const mine = new Set(state.settings.stores);

  const chip = (value, label, count) =>
    h(
      "button",
      {
        type: "button",
        class: "chip",
        "aria-pressed": String(state.filter === value),
        onclick: () => {
          state.filter = value;
          state.expanded.clear();
          renderRecipe();
        },
      },
      label,
      count !== undefined ? h("span", { class: "count" }, `${count} of ${searched}`) : null,
    );

  return h(
    "div",
    { class: "chips", role: "group", "aria-label": "Show deals from" },
    chip("all", "Cheapest anywhere"),
    mine.size > 0 ? chip("mine", "My stores") : null,
    coverage.slice(0, 6).map(({ store, count }) => chip(store, mine.has(store) ? `${store} ★` : store, count)),
  );
}

function filterLabel() {
  if (state.filter === "all") return "near you";
  if (state.filter === "mine") return "at your stores";
  return `at ${state.filter}`;
}

function saleSummary(rows) {
  const allowed = storesInFilter();
  const onSale = rows.filter((row) =>
    (row.deals ?? []).some((deal) => deal.tier === 0 && (!allowed || allowed.has(deal.merchant))),
  ).length;
  return h(
    "p",
    { class: "tally" },
    h("strong", {}, `${onSale} of ${rows.length}`),
    ` ingredients on sale ${filterLabel()}`,
  );
}

function skippedLine(label, items, extra = null) {
  if (items.length === 0) return null;
  return h(
    "p",
    { class: "skipped" },
    label,
    items.map(({ row, index }, i) => [
      i > 0 ? ", " : null,
      h(
        "button",
        { type: "button", class: "link", title: "Search for this just this time", onclick: () => searchSkipped(index) },
        row.term || row.lines[0],
      ),
    ]),
    extra,
  );
}

async function addToPantry(index) {
  state.pantry = await savePantry([...state.pantry, state.rows[index].term]);
  state.rows.forEach((row, i) => {
    if (!row.skipped && pantryMatch(row.term, state.pantry)) {
      Object.assign(row, { skipped: true, reason: "pantry", editing: false });
      state.expanded.delete(i);
    }
  });
  renderRecipe();
}

async function removeFromPantry(index) {
  const match = pantryMatch(state.rows[index].term, state.pantry);
  state.pantry = await savePantry(state.pantry.filter((item) => item !== match));
  renderRecipe();
}

function tripLine(label, plan, total) {
  return h(
    "div",
    { class: "trip-line" },
    h("span", { class: "trip-label" }, label),
    h("span", { class: "trip-stores" }, plan.stores.join(" + ")),
    h(
      "span",
      { class: "trip-numbers" },
      h("strong", {}, `${plan.covered} of ${total}`),
      plan.total > 0 ? ` about ${formatMoney(plan.total)}` : null,
    ),
  );
}

function tripSummary(rows) {
  const items = rows
    .filter((row) => row.deals)
    .map((row) => ({ key: row.term, deals: row.deals, amount: combineAmounts(row.amounts) }));
  const { yours, anywhere } = planTrips(items, state.settings);
  if (!yours && !anywhere) return null;
  return h(
    "section",
    { class: "trip", "aria-label": "Best trip" },
    yours ? tripLine("Your stores", yours, items.length) : null,
    anywhere ? tripLine(yours ? "Any store" : "Best trip", anywhere, items.length) : null,
  );
}

function flyerwatchBase() {
  return state.settings.flyerwatchUrl?.trim().replace(/\/+$/, "") || null;
}

function openList() {
  const base = flyerwatchBase();
  if (!base) return;
  const pattern = originPattern(base);
  const open = () => chrome.tabs.create({ url: `${base}/list` });
  if (!pattern) return open();
  chrome.permissions.request({ origins: [pattern] }).then(open, open);
}

async function toggleList() {
  const list = await loadList();
  const id = recipeId(state.recipe.url);
  const next = state.onList
    ? { ...list, recipes: list.recipes.filter((recipe) => recipe.id !== id) }
    : addRecipe(list, state.recipe);
  await saveList(next);
  state.onList = !state.onList;
  renderRecipe();
}

function listButton() {
  return h(
    "div",
    { class: "list-actions" },
    state.onList
      ? [
          h("span", { class: "on-list" }, "On your shopping list"),
          h("button", { type: "button", class: "link", onclick: toggleList }, "Remove"),
        ]
      : h("button", { type: "button", class: "small-button", onclick: toggleList }, "Add to shopping list"),
    flyerwatchBase() ? h("button", { type: "button", class: "link", onclick: openList }, "Open list") : null,
  );
}

function renderRecipe() {
  const { recipe, rows } = state;
  const searchedRows = rows.map((row, index) => ({ row, index })).filter(({ row }) => !row.skipped);
  const skipped = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.skipped);
  const done = searchedRows.every(({ row }) => row.status !== "loading");

  show(
    h(
      "section",
      { class: "recipe" },
      h("h1", { class: "title" }, recipe.title),
      h("p", { class: "source" }, `From ${recipe.site}`),
      listButton(),
      done ? saleSummary(searchedRows.map(({ row }) => row)) : h("p", { class: "tally" }, "Checking this week's flyers"),
      done ? tripSummary(searchedRows.map(({ row }) => row)) : null,
      done ? filterChips() : null,
      h("ul", { class: "rows" }, searchedRows.map(({ row, index }) => rowView(row, index))),
      skippedLine(
        "In your pantry: ",
        skipped.filter(({ row }) => row.reason === "pantry"),
        h("button", { type: "button", class: "link edit-pantry", onclick: () => renderSettings() }, "Edit pantry"),
      ),
      skippedLine("Not searched: ", skipped.filter(({ row }) => row.reason !== "pantry")),
    ),
  );
}

function editRow(index) {
  state.rows[index].editing = true;
  renderRecipe();
}

function cancelEdit(index) {
  Object.assign(state.rows[index], { editing: false, draft: null });
  renderRecipe();
}

function toggleMore(index) {
  if (state.expanded.has(index)) state.expanded.delete(index);
  else state.expanded.add(index);
  renderRecipe();
}

function searchSkipped(index) {
  const row = state.rows[index];
  row.skipped = false;
  row.reason = null;
  runRow(index, row.term || row.lines[0].toLowerCase());
}

async function runRow(index, term) {
  const row = state.rows[index];
  Object.assign(row, { term, draft: null, editing: false, status: "loading", deals: null });
  state.expanded.delete(index);
  renderRecipe();
  try {
    const deals = await searchDeals(state.settings.postal, term);
    Object.assign(row, { status: "ready", deals: rankDeals(deals, term, state.groceryIds) });
  } catch {
    row.status = "failed";
  }
  renderRecipe();
}

async function readRecipe() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:/.test(tab.url ?? "")) return null;
  const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readRecipeFromPage });
  return result?.result ?? null;
}

async function startRecipe() {
  show(h("p", { class: "status" }, "Reading the recipe on this page"));

  let recipe;
  try {
    recipe = await readRecipe();
  } catch {
    recipe = null;
  }
  if (!recipe) {
    show(
      h(
        "section",
        { class: "empty-state" },
        h("h1", { class: "title" }, "No recipe here"),
        h(
          "p",
          {},
          "Open a recipe page, then click Flyerwatch again. It reads recipes that include structured recipe data, which most recipe sites do.",
        ),
      ),
    );
    return;
  }

  try {
    const flyers = await getGroceryFlyers(state.settings.postal);
    state.groceryIds = new Set(flyers.map((flyer) => flyer.id));
  } catch {
    show(h("p", { class: "status error" }, "Flipp didn't answer. Close and reopen to try again."));
    return;
  }

  state.recipe = recipe;
  state.onList = (await loadList()).recipes.some((entry) => entry.id === recipeId(recipe.url));
  state.filter = state.settings.stores.length > 0 ? "mine" : "all";
  state.rows = buildRows(recipe.ingredients);
  renderRecipe();

  await Promise.all(state.rows.map((row, index) => (row.skipped ? null : runRow(index, row.term))));
}

connectSettings({
  state,
  show,
  updateHeader,
  startRecipe,
  back: () => (state.recipe ? renderRecipe() : startRecipe()),
});

gear.addEventListener("click", () => renderSettings());

state.settings = await loadSettings();
state.pantry = await loadPantry();
updateHeader();
if (state.settings.postal) startRecipe();
else renderSetup();
