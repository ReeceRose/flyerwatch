import type { Flyer, Rect } from "@/lib/flipp";

/**
 * Flipp serves each flyer as 256px JPEG tiles at several zoom levels, from a
 * CDN that any page can load. Tiles are named `{level}_{column}_{row}.jpg`,
 * with rows counted up from the bottom edge, and every tile is a full 256px
 * square. Rects are in flyer units, measured from the top-left corner.
 *
 * The browser lays the tiles out itself, so showing a flyer costs this site
 * nothing to render.
 */
export type TileSource = {
  /** The flyer these tiles belong to. */
  id: number;
  path: string;
  resolutions: number[];
  width: number;
  height: number;
};

export type Tile = {
  url: string;
  /** Position and size as percentages of the region. */
  left: number;
  top: number;
  width: number;
  height: number;
};

const TILE = 256;
const COVER_ASPECT = 4 / 3;

export function tileSource(flyer: Flyer): TileSource {
  return { id: flyer.id, path: flyer.tilePath, resolutions: flyer.resolutions, width: flyer.width, height: flyer.height };
}

/** The top of the first page, cut to the 3:4 shape of a flyer cover. */
export function coverRect(firstPage: Rect): Rect {
  return {
    ...firstPage,
    w: Math.min(firstPage.w, firstPage.h / COVER_ASPECT),
    h: Math.min(firstPage.h, firstPage.w * COVER_ASPECT),
  };
}

/**
 * The tiles covering `rect`, from the smallest zoom level that is still at
 * least `outWidth` pixels across, or null when the rect misses the flyer.
 */
export function tileLayout(source: TileSource, rect: Rect, outWidth: number): { aspect: number; tiles: Tile[] } | null {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const w = Math.min(rect.w, source.width - x);
  const h = Math.min(rect.h, source.height - y);
  if (!(w > 0 && h > 0) || source.resolutions.length === 0) return null;

  const levels = source.resolutions;
  let level = levels.findIndex((unitsPerPixel) => w / unitsPerPixel >= outWidth);
  if (level < 0) level = levels.length - 1;
  const scale = levels[level];

  // Region in this level's pixels; `top` and `bottom` count up from the bottom edge.
  const left = Math.floor(x / scale);
  const width = Math.max(1, Math.round(w / scale));
  const top = Math.round((source.height - y) / scale);
  const bottom = Math.max(0, top - Math.round(h / scale));
  const height = Math.max(1, top - bottom);

  // Tiles past the flyer's edge don't exist, so never ask for them.
  const maxCol = Math.floor((Math.ceil(source.width / scale) - 1) / TILE);
  const maxRow = Math.floor((Math.ceil(source.height / scale) - 1) / TILE);
  const firstCol = Math.floor(left / TILE);
  const lastCol = Math.min(maxCol, Math.floor((left + width - 1) / TILE));
  const firstRow = Math.floor(bottom / TILE);
  const lastRow = Math.min(maxRow, Math.floor((top - 1) / TILE));

  const base = `https://f.wishabi.net/${source.path.replace(/\/?$/, "/")}`;
  const tiles: Tile[] = [];
  for (let row = lastRow; row >= firstRow; row--) {
    for (let col = firstCol; col <= lastCol; col++) {
      tiles.push({
        url: `${base}${level}_${col}_${row}.jpg`,
        left: ((col * TILE - left) / width) * 100,
        top: ((top - (row + 1) * TILE) / height) * 100,
        width: (TILE / width) * 100,
        height: (TILE / height) * 100,
      });
    }
  }
  return { aspect: width / height, tiles };
}
