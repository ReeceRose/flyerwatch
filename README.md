# <img src="brand/logo.svg" alt="" width="36" height="36" align="top" /> Flyerwatch

Compare this week's grocery flyer prices near you. Data comes from Flipp's public flyer API (unofficial and undocumented, so it may change).

```bash
git clone https://github.com/ReeceRose/flyerwatch.git
cd flyerwatch
pnpm install
pnpm dev
```

- `/` searches every nearby flyer and sorts by lowest price, or by price per pound.
- `/flyers` lists this week's grocery flyers; open one to see and filter every deal.
- `/tour` shows what the site and extension do, with screenshots.
- The postal code (default N2G 1A1, Kitchener) is stored in a cookie. Change it from the header.

Flipp responses are cached for an hour with `"use cache"` (`src/lib/flipp.ts`).

## Shopping list

`/list` combines the recipes you add from the extension into one list:

- Picks the best stores to visit (up to 1, 2 or 3), once with your stores and once with any store nearby, with a rough total at sale prices.
- Groups items by store, with checkboxes, print styles, and **Send to phone**: a QR code and link that carry the whole list after the `#`, so nothing is stored on the server.
- Settings, pantry and list live in the extension when it's connected, otherwise in this browser's local storage (`src/lib/shopping/store.ts`).

Ingredient parsing, matching, price estimates and the trip planner are plain JavaScript in `src/shared/`, used by both the site and the extension. After editing them, run `pnpm sync:extension` to copy them into `extension/lib/shared/`.

## Chrome extension

`extension/` holds a Chrome extension that checks the ingredients of any recipe you open against this week's flyers. It isn't in the Chrome Web Store yet, so install it by hand:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick the `extension` folder.
3. Pin it, open a recipe, and click it (or press Alt+Shift+F).

[docs/extension-install.md](docs/extension-install.md) covers connecting it to the site, updating, sharing a zip, and troubleshooting. [extension/README.md](extension/README.md) explains how it works.

## Project layout

| Path | What's there |
| --- | --- |
| `src/app/` | Pages (`/`, `/flyers`, `/flyers/[id]`, `/list`, `/share`, `/tour`) and API routes used by the list and extension |
| `src/components/` | UI components; `shopping/` holds the list, trip plans and share dialog |
| `src/lib/` | Flipp client (`flipp.ts`), postal code cookie, flyer image tiles (`tiles.ts`, uses `sharp`), shopping list state |
| `src/shared/` | Plain JS shared with the extension: ingredient parsing, matching, prices, trip planner |
| `public/sw.js` | Service worker that keeps a shared list available offline under `/share` |
| `extension/` | The Chrome extension (Manifest V3, no build step) |
| `scripts/sync-extension.mjs` | Copies `src/shared/` into `extension/lib/shared/` |

## Checks

There are no tests yet. Before committing, run:

```bash
pnpm build             # type-checks and builds
pnpm sync:extension    # if you touched src/shared/
```

## License

[MIT](LICENSE)

## Logo

`brand/logo.svg` is the source for every icon: the favicon, `icon.svg`, the Apple touch icon, the web manifest icons and the extension's icons. After you change it, run `pnpm build:icons` to regenerate them all, and update the inline copy in `src/components/logo.tsx`.
