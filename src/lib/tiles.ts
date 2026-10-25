import "server-only";
import sharp, { type OverlayOptions } from "sharp";
import type { Flyer, Rect } from "@/lib/flipp";

const TILE = 256;
const MAX_TILES = 96;
const CACHE_LIMIT = 300;
const MAX_RENDERING = 4;

const rendered = new Map<string, Buffer>();
const rendering = new Map<string, Promise<Buffer>>();

// Each render fetches dozens of tiles and runs sharp, so only a few run at
// once, a few more wait their turn, and the rest are turned away.
const MAX_WAITING = 64;
let active = 0;
const waiting: (() => void)[] = [];

async function limited<T>(work: () => Promise<T>): Promise<T> {
  if (active < MAX_RENDERING) active++;
  else if (waiting.length < MAX_WAITING) await new Promise<void>((resolve) => waiting.push(resolve));
  else throw new Error("Too many images rendering");
  try {
    return await work();
  } finally {
    // Hand this slot straight to the next in line, or free it.
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

function remember(key: string, image: Buffer) {
  rendered.set(key, image);
  if (rendered.size > CACHE_LIMIT) {
    const oldest = rendered.keys().next().value;
    if (oldest) rendered.delete(oldest);
  }
}

async function fetchTile(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/**
 * Flipp serves each flyer as 256px JPEG tiles at several zoom levels.
 * Tiles are named `{level}_{column}_{row}.jpg`, with rows counted up from the bottom edge.
 * Rects are in flyer units, measured from the top-left corner.
 */
export async function renderRegion(flyer: Flyer, rect: Rect, outWidth: number): Promise<Buffer> {
  const key = `${flyer.id}:${rect.x}:${rect.y}:${rect.w}:${rect.h}:${outWidth}`;
  const cached = rendered.get(key);
  if (cached) return cached;

  // The same image requested twice at once is only built once.
  let pending = rendering.get(key);
  if (!pending) {
    pending = limited(() => render(flyer, rect, outWidth)).finally(() => rendering.delete(key));
    rendering.set(key, pending);
  }
  const image = await pending;
  remember(key, image);
  return image;
}

async function render(flyer: Flyer, rect: Rect, outWidth: number): Promise<Buffer> {
  const levels = flyer.resolutions;
  let level = levels.findIndex((unitsPerPixel) => rect.w / unitsPerPixel >= outWidth);
  if (level < 0) level = levels.length - 1;
  const scale = levels[level];

  const left = Math.floor(rect.x / scale);
  const width = Math.max(1, Math.round(rect.w / scale));
  const top = Math.round((flyer.height - rect.y) / scale);
  const bottom = Math.max(0, top - Math.round(rect.h / scale));
  const height = Math.max(1, top - bottom);

  const firstCol = Math.floor(left / TILE);
  const lastCol = Math.floor((left + width - 1) / TILE);
  const firstRow = Math.floor(bottom / TILE);
  const lastRow = Math.floor((top - 1) / TILE);

  const count = (lastCol - firstCol + 1) * (lastRow - firstRow + 1);
  if (count > MAX_TILES) throw new Error(`Region needs ${count} tiles`);

  const base = `https://f.wishabi.net/${flyer.tilePath.replace(/\/?$/, "/")}`;
  const jobs: Promise<OverlayOptions | null>[] = [];
  for (let col = firstCol; col <= lastCol; col++) {
    for (let row = firstRow; row <= lastRow; row++) {
      jobs.push(
        fetchTile(`${base}${level}_${col}_${row}.jpg`).then((input) =>
          input ? { input, left: (col - firstCol) * TILE, top: (lastRow - row) * TILE } : null,
        ),
      );
    }
  }
  const tiles = (await Promise.all(jobs)).filter((tile): tile is OverlayOptions => tile !== null);
  if (tiles.length === 0) throw new Error("No tiles available");

  const canvas = await sharp({
    create: {
      width: (lastCol - firstCol + 1) * TILE,
      height: (lastRow - firstRow + 1) * TILE,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(tiles)
    .png()
    .toBuffer();

  return sharp(canvas)
    .extract({
      left: left - firstCol * TILE,
      top: (lastRow + 1) * TILE - top,
      width,
      height,
    })
    .resize({ width: outWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
