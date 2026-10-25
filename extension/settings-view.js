import { clearCache, getGroceryStores } from "./lib/flipp.js";
import { h } from "./lib/dom.js";
import { normalizeItem } from "./lib/shared/pantry.js";
import { formatPostal } from "./lib/shared/format.js";
import { normalizePostal, originPattern, saveSettings, savePantry } from "./lib/storage.js";

// Set by popup.js: shared state and the navigation the forms need.
let ctx = null;

export function connectSettings(context) {
  ctx = context;
}

function storePicker(stores, chosen) {
  return h(
    "fieldset",
    { class: "stores" },
    h("legend", {}, "Your stores"),
    h("p", { class: "hint" }, "Deals from these stores show first. You can still see every store."),
    stores.length === 0
      ? h("p", { class: "hint" }, "No grocery flyers for this postal code.")
      : h(
          "div",
          { class: "store-grid" },
          stores.map((store) =>
            h(
              "label",
              { class: "store" },
              h("input", { type: "checkbox", name: "store", value: store, checked: chosen.has(store) }),
              store,
            ),
          ),
        ),
  );
}

function postalField(value) {
  return h(
    "label",
    { class: "field" },
    h("span", {}, "Postal code"),
    h("input", { name: "postal", value: formatPostal(value ?? ""), autocomplete: "postal-code", required: true }),
  );
}

export function renderSetup() {
  ctx.updateHeader();
  const error = h("p", { class: "error", role: "alert" });
  const form = h(
    "form",
    {
      class: "setup",
      onsubmit: async (event) => {
        event.preventDefault();
        const postal = normalizePostal(new FormData(form).get("postal"));
        if (!postal) {
          error.textContent = "Enter a Canadian postal code, like N2G 1A1.";
          return;
        }
        await renderStoreStep(postal);
      },
    },
    h("h1", { class: "title" }, "Where do you shop?"),
    h("p", {}, "Flyerwatch checks this week's grocery flyers near you for the ingredients in any recipe you open."),
    postalField(ctx.state.settings.postal ?? "N2G1A1"),
    error,
    h("button", { type: "submit", class: "button" }, "Find my stores"),
  );
  ctx.show(form);
}

async function renderStoreStep(postal) {
  ctx.show(h("p", { class: "status" }, "Finding grocery flyers near you"));
  let stores;
  try {
    stores = await getGroceryStores(postal);
  } catch {
    ctx.show(h("p", { class: "status error" }, "Flipp didn't answer. Close and reopen to try again."));
    return;
  }
  const form = h(
    "form",
    {
      class: "setup",
      onsubmit: async (event) => {
        event.preventDefault();
        const chosen = new FormData(form).getAll("store").map(String);
        ctx.state.settings = { ...ctx.state.settings, postal, stores: chosen };
        await saveSettings(ctx.state.settings);
        ctx.updateHeader();
        ctx.startRecipe();
      },
    },
    h("h1", { class: "title" }, "Pick your stores"),
    storePicker(stores, new Set()),
    h("button", { type: "submit", class: "button" }, "Done"),
  );
  ctx.show(form);
}

function pantryEditor(items, onChange) {
  const input = h("input", { type: "text", "aria-label": "Add a pantry item", placeholder: "cumin, olive oil, flour" });
  const add = () => {
    const added = input.value.split(",").map(normalizeItem).filter(Boolean);
    if (added.length) onChange([...new Set([...items, ...added])].sort((a, b) => a.localeCompare(b)));
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  });

  return h(
    "fieldset",
    { class: "stores" },
    h("legend", {}, "Pantry"),
    h("p", { class: "hint" }, "Things you always have. They're never searched. \"cumin\" also covers \"ground cumin\"."),
    items.length > 0
      ? h(
          "ul",
          { class: "pantry-list" },
          items.map((item) =>
            h(
              "li",
              { class: "pantry-item" },
              item,
              h(
                "button",
                {
                  type: "button",
                  class: "remove",
                  "aria-label": `Remove ${item}`,
                  onclick: () => onChange(items.filter((other) => other !== item)),
                },
                "×",
              ),
            ),
          ),
        )
      : h("p", { class: "hint" }, "Nothing yet. Use Add to pantry on any ingredient, or add items here."),
    h("div", { class: "pantry-add" }, input, h("button", { type: "button", class: "small-button", onclick: add }, "Add")),
  );
}

function tripFields(trip) {
  return h(
    "fieldset",
    { class: "stores" },
    h("legend", {}, "Trips"),
    h(
      "label",
      { class: "inline-field" },
      "Visit up to",
      h(
        "select",
        { name: "maxStores" },
        [1, 2, 3].map((n) => h("option", { value: String(n), selected: trip.maxStores === n }, String(n))),
      ),
      "stores",
    ),
    h(
      "label",
      { class: "store" },
      h("input", { type: "checkbox", name: "compareAnywhere", checked: trip.compareAnywhere }),
      "Also show the best trip using any store nearby",
    ),
    h(
      "label",
      { class: "store" },
      h("input", { type: "checkbox", name: "includeSimilar", checked: trip.includeSimilar }),
      "Count similar items as on sale",
    ),
  );
}

async function updateConnection(slot, url) {
  const pattern = originPattern(url.trim());
  if (!pattern) {
    slot.replaceChildren();
    return;
  }
  const allowed = await chrome.permissions.contains({ origins: [pattern] });
  slot.replaceChildren(
    allowed
      ? h("p", { class: "hint" }, `Connected. Flyerwatch at ${new URL(url).host} can read your list and settings.`)
      : h(
          "div",
          {},
          h("p", { class: "hint" }, "Let Flyerwatch read your shopping list, stores and pantry from this extension."),
          h(
            "button",
            {
              type: "button",
              class: "small-button",
              onclick: () => {
                chrome.permissions.request({ origins: [pattern] }).then(() => updateConnection(slot, url));
              },
            },
            `Connect to ${new URL(url).host}`,
          ),
        ),
  );
}

export async function renderSettings() {
  const { settings } = ctx.state;
  const stores = await getGroceryStores(settings.postal).catch(() => []);
  const error = h("p", { class: "error", role: "alert" });
  const storeSlot = h("div", {}, storePicker(stores, new Set(settings.stores)));
  let pantryDraft = [...ctx.state.pantry];
  const pantrySlot = h("div", {});
  const renderPantry = () => pantrySlot.replaceChildren(pantryEditor(pantryDraft, (next) => {
    pantryDraft = next;
    renderPantry();
  }));
  renderPantry();

  const urlInput = h("input", {
    name: "flyerwatchUrl",
    value: settings.flyerwatchUrl ?? "",
    placeholder: "http://localhost:3000",
    oninput: () => updateConnection(connection, urlInput.value),
  });
  const connection = h("div", { class: "connection" });
  updateConnection(connection, urlInput.value);

  const form = h(
    "form",
    {
      class: "setup",
      onsubmit: async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const postal = normalizePostal(data.get("postal"));
        if (!postal) {
          error.textContent = "Enter a Canadian postal code, like N2G 1A1.";
          return;
        }
        if (postal !== settings.postal) await clearCache();
        ctx.state.settings = {
          ...settings,
          postal,
          stores: data.getAll("store").map(String),
          flyerwatchUrl: String(data.get("flyerwatchUrl") ?? "").trim(),
          trip: {
            maxStores: Number(data.get("maxStores")),
            compareAnywhere: data.get("compareAnywhere") === "on",
            includeSimilar: data.get("includeSimilar") === "on",
          },
        };
        await saveSettings(ctx.state.settings);
        ctx.state.pantry = await savePantry(pantryDraft);
        ctx.updateHeader();
        ctx.startRecipe();
      },
    },
    h("h1", { class: "title" }, "Settings"),
    postalField(settings.postal),
    h(
      "button",
      {
        type: "button",
        class: "link",
        onclick: async () => {
          const postal = normalizePostal(new FormData(form).get("postal"));
          if (!postal) {
            error.textContent = "Enter a Canadian postal code, like N2G 1A1.";
            return;
          }
          error.textContent = "";
          const found = await getGroceryStores(postal).catch(() => []);
          storeSlot.replaceChildren(storePicker(found, new Set(settings.stores)));
        },
      },
      "Show stores for this postal code",
    ),
    error,
    storeSlot,
    tripFields(settings.trip),
    pantrySlot,
    h(
      "label",
      { class: "field" },
      h("span", {}, "Flyerwatch address"),
      urlInput,
      h("small", { class: "hint" }, "Your shopping list lives here, and clicking a deal opens its flyer."),
    ),
    connection,
    h(
      "div",
      { class: "actions" },
      h("button", { type: "submit", class: "button" }, "Save"),
      h("button", { type: "button", class: "link", onclick: () => ctx.back() }, "Cancel"),
    ),
  );
  ctx.show(form);
}
