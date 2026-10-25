import { getFlyer, getFlyers, type Rect } from "@/lib/flipp";
import { readPostal } from "@/lib/postal";
import { renderRegion } from "@/lib/tiles";

const COVER_ASPECT = 4 / 3;

function number(value: string | null): number | null {
  if (value === null) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: Request, ctx: RouteContext<"/api/flyers/[id]/image">) {
  const { id } = await ctx.params;
  const flyerId = Number.parseInt(id, 10);
  const query = new URL(request.url).searchParams;
  const out = Math.min(1600, Math.max(64, Math.round(number(query.get("out")) ?? 480)));

  const postal = await readPostal();
  const flyer = (await getFlyers(postal).catch(() => [])).find((f) => f.id === flyerId);
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
    if (x !== null && y !== null && w !== null && h !== null && w > 0 && h > 0) rect = { x, y, w, h };
  }
  if (!rect) return new Response("Missing image region", { status: 400 });

  try {
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
