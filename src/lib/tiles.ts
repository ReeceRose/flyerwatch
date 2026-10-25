import "server-only";
import sharp, { type OverlayOptions } from "sharp";
import type { Flyer, Rect } from "@/lib/flipp";

const TILE = 256;
const MAX_TILES = 96;
const CACHE_LIMIT = 300;

const rendered = new Map<string, Buffer>();

function remember(key: string, image: Buffer) {
  rendered.set(key, image);
  if (rendered.size > CACHE_LIMIT) {
    const oldest = rendered.keys().next().value;
    if (oldest) rendered.delete(oldest);
  }
}

async function fetchTile(url: string): Promise<Buffer | null> {
  const res = await fetch(url);
  return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
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

  const image = await sharp(canvas)
    .extract({
      left: left - firstCol * TILE,
      top: (lastRow + 1) * TILE - top,
      width,
      height,
    })
    .resize({ width: outWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  remember(key, image);
  return image;
}
