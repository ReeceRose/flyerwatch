import { getFlyer, getFlyers, type Flyer, type Rect } from "@/lib/flipp";
import { normalizePostal, readPostal } from "@/lib/postal";
import { renderRegion } from "@/lib/tiles";

const COVER_ASPECT = 4 / 3;
const OUT_STEP = 20;

function number(value: string | null): number | null {
  if (value === null) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

// Whole flyer units, inside the flyer. Rounding keeps near-identical requests
// on the same cached image instead of rendering each one again.
function fit(rect: Rect, flyer: Flyer): Rect | null {
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const w = Math.min(Math.round(rect.w), Math.floor(flyer.width) - x);
  const h = Math.min(Math.round(rect.h), Math.floor(flyer.height) - y);
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

export async function GET(request: Request, ctx: RouteContext<"/api/flyers/[id]/image">) {
  const { id } = await ctx.params;
  const flyerId = Number.parseInt(id, 10);
  const query = new URL(request.url).searchParams;
  const requested = Math.min(1600, Math.max(64, number(query.get("out")) ?? 480));
  const out = Math.round(requested / OUT_STEP) * OUT_STEP;

  // Links can carry the postal code the flyer was found with, so they work for
  // someone whose own postal code is somewhere else.
  const postal = normalizePostal(query.get("postal") ?? "") ?? (await readPostal());

  try {
    const flyer = (await getFlyers(postal)).find((f) => f.id === flyerId);
    if (!flyer) return new Response("Flyer not found near this postal code", { status: 404 });

    let rect: Rect | null = null;
    if (query.get("cover") !== null) {
      const { pages } = await getFlyer(postal, flyerId);
      const first = pages[0]?.rect;
      if (first) {
        rect = {
          ...first,
          w: Math.min(first.w, first.h / COVER_ASPECT),
          h: Math.min(first.h, first.w * COVER_ASPECT),
        };
      }
    } else {
      const [x, y, w, h] = ["x", "y", "w", "h"].map((key) => number(query.get(key)));
      if (x !== null && y !== null && w !== null && h !== null) rect = { x, y, w, h };
    }
    rect = rect && fit(rect, flyer);
    if (!rect) return new Response("Missing image region", { status: 400 });

    const image = await renderRegion(flyer, rect, out);
    return new Response(new Uint8Array(image), {
      headers: {
        "content-type": "image/webp",
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Couldn't build this image from the flyer", { status: 502 });
  }
}
