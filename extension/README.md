# Flyerwatch: Recipe deals

A Chrome extension that reads the recipe on the page you're looking at and shows which ingredients are on sale in this week's grocery flyers near you.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this `extension` folder.
3. Pin the extension, open a recipe, and click it (or press Alt+Shift+F).

It isn't in the Chrome Web Store, so updates are manual too. See [../docs/extension-install.md](../docs/extension-install.md) for updating, sharing a copy and troubleshooting.

The first time, it asks for your postal code and your stores. The gear icon changes them later.

## Shopping list

**Add to shopping list** in the popup saves the recipe. Open your Flyerwatch site's `/list` to plan the trip across every saved recipe.

To let the site read the list, open settings (gear icon), check the Flyerwatch address, and click **Connect**. Chrome asks once for access to that site. `background.js` then runs `bridge.js` on it, which lets the page read and change your settings, pantry and list. Chrome's site access covers every port on that host, so the bridge also checks the page's address and only answers the exact Flyerwatch address, port included. Nothing else gets that access.

## How it works

- `lib/shared/` is copied from Flyerwatch's `src/shared/` by `pnpm sync:extension`. Edit it there, not here.
- `lib/read-recipe.js` reads the page's JSON-LD `Recipe` data, the same way Tastebase imports recipes.
- `lib/shared/ingredients.js` turns each line into a search word: "2 tbsp extra-virgin olive oil, divided" becomes "extra-virgin olive oil". Salt, pepper and water are skipped.
- `lib/storage.js` keeps settings in Chrome sync storage, and your pantry and list in local storage. Pantry items are never searched; "cumin" also covers "ground cumin".
- `lib/shared/planner.js` estimates costs from recipe amounts and picks the stores to visit.
- `lib/flipp.js` searches Flipp's flyer API directly (no server needed) and caches results for 6 hours. Expired results are cleared each time the popup opens.
- `lib/shared/match.js` keeps grocery-store results that contain the ingredient, ranks real matches above products that only mention it ("butter tart filling"), then sorts by price per lb or per item.

Clicking a deal opens its flyer in Flyerwatch, if you've set its address in settings (default `http://localhost:3000`).

Flipp's API is unofficial and can change without notice.
