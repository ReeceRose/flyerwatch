# Installing the Flyerwatch extension

The extension isn't in the Chrome Web Store yet, so you load it by hand as an unpacked extension. This works in Chrome and other Chromium browsers (Edge, Brave, Arc, Vivaldi).

The extension works on its own: it searches Flipp directly, so you don't need the Flyerwatch site running to see deals for a recipe. You only need the site for the shopping list planner (`/list`) and for opening a deal's flyer.

## Install

1. Get the `extension/` folder onto your computer, either by cloning [the repo](https://github.com/ReeceRose/flyerwatch) or by unzipping a copy someone sent you (see [Sharing a copy](#sharing-a-copy)). Keep it somewhere permanent: Chrome loads the files from that folder every time, so moving or deleting it breaks the extension.
2. Open `chrome://extensions` (`edge://extensions` in Edge, `brave://extensions` in Brave).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the `extension` folder, the one that contains `manifest.json`.
5. Click the puzzle-piece icon in the toolbar and pin **Flyerwatch: Recipe deals**.

## First run

1. Open any recipe page (most recipe sites publish the structured data the extension reads).
2. Click the Flyerwatch icon, or press **Alt+Shift+F**.
3. Enter your postal code and pick the stores you shop at. The gear icon changes these later.

Settings sync through your Chrome profile. Your pantry and shopping list stay on this computer.

## Connect to the site

To plan a trip from saved recipes, the site at `/list` needs to read the list the extension keeps.

1. Start the site (`pnpm dev`, so `http://localhost:3000`) or use wherever it's deployed.
2. In the extension, open settings (gear icon) and check the **Flyerwatch address**. It defaults to `http://localhost:3000`.
3. Click **Connect to …**. Chrome asks once for permission to run on that site.
4. Open `/list` on the site. It now shows the recipes you added with **Add to shopping list**.

Only the address you connect gets access. If you change the address, connect again. To revoke access, go to `chrome://extensions`, open the extension's **Details**, and remove the site under **Site access**.

## Updating

Chrome doesn't update unpacked extensions on its own.

1. Pull the latest code (or replace the folder with a newer copy).
2. If you changed anything in `src/shared/`, run `pnpm sync:extension` first.
3. On `chrome://extensions`, click the reload arrow on the Flyerwatch card.
4. Reload any recipe or Flyerwatch tabs that were already open.

Your settings, pantry and list survive a reload. They're deleted if you **Remove** the extension.

## Sharing a copy

To give the extension to someone without the repo, zip the folder:

```bash
pnpm sync:extension
cd extension && zip -r ../flyerwatch-extension.zip . -x '.*' && cd ..
```

They unzip it into a folder they'll keep, then follow [Install](#install). Bump `version` in `extension/manifest.json` when you send out a new copy so it's easy to tell which one someone has.

## Troubleshooting

- **"Manifest file is missing or unreadable"**: you picked the wrong folder. Choose the one that directly contains `manifest.json`.
- **"No recipe here"**: the site doesn't publish JSON-LD `Recipe` data. Try the recipe's print view or another site.
- **`/list` shows "No recipes yet" or "Saved in this browser"**: the site isn't connected to the extension. Check the address in the extension's settings matches the site exactly, including `http`/`https` and the port, then click **Connect** and reload the page.
- **No deals, or errors from Flipp**: Flipp's API is unofficial and can change. Check the extension's errors on `chrome://extensions` (the **Errors** button on its card) and the service worker console (**Inspect views: service worker**).
- **Chrome warns about developer mode extensions on startup**: expected for unpacked extensions. Dismiss it; the extension keeps working.
