import type { Rect } from "@/lib/flipp";
import { type TileSource, tileLayout } from "@/lib/tiles";

export type FlyerRegionProps = {
  source: TileSource;
  rect: Rect;
  /** Smallest width in pixels the tiles should cover. */
  width: number;
  alt?: string;
  loading?: "lazy" | "eager";
  className?: string;
};

/** Part of a flyer, laid out from Flipp's tiles by the browser. */
export function FlyerRegion({ source, rect, width, alt = "", loading = "lazy", className = "" }: FlyerRegionProps) {
  const layout = tileLayout(source, rect, width);
  if (!layout) return null;

  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={`relative overflow-hidden bg-white ${className}`}
      style={{ aspectRatio: layout.aspect }}
    >
      {layout.tiles.map((tile) => (
        <img
          key={tile.url}
          src={tile.url}
          alt=""
          loading={loading}
          decoding="async"
          draggable={false}
          className="absolute max-w-none select-none"
          // A hair of overlap hides the seams scaling can leave between tiles.
          style={{
            left: `${tile.left}%`,
            top: `${tile.top}%`,
            width: `calc(${tile.width}% + 0.5px)`,
            height: `calc(${tile.height}% + 0.5px)`,
          }}
        />
      ))}
    </div>
  );
}
