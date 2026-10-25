import type { Deal, Rect } from "@/lib/flipp";

export function coverUrl(flyerId: number, width = 480): string {
  return `/api/flyers/${flyerId}/image?cover&out=${width}`;
}

/** `postal` is where the flyer was found, for links opened by someone elsewhere. */
export function regionUrl(flyerId: number, rect: Rect, width: number, postal?: string): string {
  const params = new URLSearchParams({
    x: rect.x.toFixed(1),
    y: rect.y.toFixed(1),
    w: rect.w.toFixed(1),
    h: rect.h.toFixed(1),
    out: String(width),
  });
  if (postal) params.set("postal", postal);
  return `/api/flyers/${flyerId}/image?${params}`;
}

export function dealImageUrl(deal: Deal, width: number, postal?: string): string | null {
  return deal.rect ? regionUrl(deal.flyerId, deal.rect, width, postal) : null;
}
