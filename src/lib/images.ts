import type { Deal, Rect } from "@/lib/flipp";

export function coverUrl(flyerId: number, width = 480): string {
  return `/api/flyers/${flyerId}/image?cover&out=${width}`;
}

export function regionUrl(flyerId: number, rect: Rect, width: number): string {
  const params = new URLSearchParams({
    x: rect.x.toFixed(1),
    y: rect.y.toFixed(1),
    w: rect.w.toFixed(1),
    h: rect.h.toFixed(1),
    out: String(width),
  });
  return `/api/flyers/${flyerId}/image?${params}`;
}

export function dealImageUrl(deal: Deal, width: number): string | null {
  return deal.rect ? regionUrl(deal.flyerId, deal.rect, width) : null;
}
