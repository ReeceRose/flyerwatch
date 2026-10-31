import "server-only";
import { cacheLife } from "next/cache";

const BASE = "https://backflipp.wishabi.com/flipp";

export type Rect = { x: number; y: number; w: number; h: number };

export type Flyer = {
  id: number;
  merchant: string;
  merchantId: number;
  name: string;
  validFrom: string;
  validTo: string;
  categories: string[];
  thumbnailUrl: string | null;
  logoUrl: string | null;
  tilePath: string;
  resolutions: number[];
  width: number;
  height: number;
};

export type FlyerPage = { page: number; rect: Rect };

export type Deal = {
  id: number;
  flyerId: number;
  merchant: string;
  name: string;
  price: number | null;
  originalPrice: number | null;
  prePriceText: string | null;
  postPriceText: string | null;
  saleStory: string | null;
  imageUrl: string | null;
  validTo: string | null;
  rect: Rect | null;
};

export type DealDetail = Deal & {
  description: string | null;
  priceText: string | null;
  disclaimer: string | null;
  storeUrl: string | null;
  flyerImageUrl: string | null;
};

type RawFlyer = {
  id: number;
  merchant: string;
  merchant_id: number;
  name: string;
  valid_from: string;
  valid_to: string;
  categories?: string[];
  thumbnail_url?: string | null;
  merchant_logo?: string | null;
  path: string;
  resolutions: number[];
  width: number;
  height: number;
};

type RawPage = { page: number; left: number; right: number; top: number; bottom: number };

type RawItem = {
  id: number;
  flyer_id: number;
  name?: string | null;
  merchant?: string | null;
  merchant_name?: string | null;
  price?: string | number | null;
  current_price?: string | number | null;
  original_price?: string | number | null;
  pre_price_text?: string | null;
  post_price_text?: string | null;
  price_text?: string | null;
  sale_story?: string | null;
  clean_image_url?: string | null;
  cutout_image_url?: string | null;
  image_url?: string | null;
  valid_to?: string | null;
  item_type?: string;
  description?: string | null;
  disclaimer_text?: string | null;
  ttm_url?: string | null;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
};

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("locale", "en-ca");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Flipp responded ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

function https(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://");
}

function money(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toFlyer(raw: RawFlyer): Flyer {
  return {
    id: raw.id,
    merchant: raw.merchant.trim(),
    merchantId: raw.merchant_id,
    name: raw.name,
    validFrom: raw.valid_from,
    validTo: raw.valid_to,
    categories: raw.categories ?? [],
    thumbnailUrl: https(raw.thumbnail_url),
    logoUrl: https(raw.merchant_logo),
    tilePath: raw.path,
    resolutions: raw.resolutions,
    width: raw.width,
    height: raw.height,
  };
}

function toRect(raw: { left?: number; top?: number; right?: number; bottom?: number }): Rect | null {
  const { left, top, right, bottom } = raw;
  if (left === undefined || top === undefined || right === undefined || bottom === undefined) return null;
  if (right <= left || top <= bottom) return null;
  return { x: left, y: -top, w: right - left, h: top - bottom };
}

function toDeal(raw: RawItem, merchant: string): Deal {
  return {
    id: raw.id,
    flyerId: raw.flyer_id,
    merchant: (raw.merchant_name ?? raw.merchant ?? merchant).trim(),
    name: raw.name?.trim() ?? "",
    price: money(raw.current_price ?? raw.price),
    originalPrice: money(raw.original_price),
    prePriceText: text(raw.pre_price_text),
    postPriceText: text(raw.post_price_text),
    saleStory: text(raw.sale_story),
    imageUrl: https(raw.clean_image_url ?? raw.cutout_image_url),
    validTo: raw.valid_to ?? null,
    rect: toRect(raw),
  };
}

export async function getFlyers(postalCode: string): Promise<Flyer[]> {
  "use cache";
  cacheLife("hours");

  const data = await get<{ flyers: RawFlyer[] }>("/flyers", { postal_code: postalCode });
  return data.flyers.map(toFlyer);
}

export async function getFlyer(
  postalCode: string,
  flyerId: number,
): Promise<{ flyer: Flyer | null; deals: Deal[]; pages: FlyerPage[] }> {
  "use cache";
  cacheLife("hours");

  const [flyers, data] = await Promise.all([
    getFlyers(postalCode),
    get<{ items: RawItem[]; pages?: RawPage[] }>(`/flyers/${flyerId}`),
  ]);
  const flyer = flyers.find((f) => f.id === flyerId) ?? null;
  const merchant = flyer?.merchant ?? "";

  const deals = data.items
    .filter((item) => item.name?.trim())
    .sort((a, b) => (a.left ?? 0) - (b.left ?? 0) || (b.top ?? 0) - (a.top ?? 0))
    .map((item) => toDeal(item, merchant));

  const pages = (data.pages ?? [])
    .map((page) => ({ page: page.page, rect: toRect(page) }))
    .filter((page): page is FlyerPage => page.rect !== null)
    .sort((a, b) => a.page - b.page);

  return { flyer, deals, pages };
}

export async function searchDeals(postalCode: string, query: string): Promise<Deal[]> {
  "use cache";
  cacheLife("hours");

  const data = await get<{ items: RawItem[] }>("/items/search", {
    postal_code: postalCode,
    q: query,
  });

  return data.items
    .filter((item) => item.item_type === "flyer" && item.name?.trim())
    .map((item) => toDeal(item, ""));
}

export async function getDealDetail(itemId: number): Promise<DealDetail> {
  "use cache";
  cacheLife("hours");

  const { item } = await get<{ item: RawItem }>(`/items/${itemId}`);
  return {
    ...toDeal(item, ""),
    description: text(item.description),
    priceText: text(item.price_text),
    disclaimer: text(item.disclaimer_text),
    storeUrl: text(item.ttm_url),
    flyerImageUrl: https(item.image_url),
  };
}

/**
 * Where the first page sits, for drawing a flyer's cover. A flyer's pages never
 * change, so this is kept for days and shared by every postal code and server.
 */
export async function getFirstPage(flyerId: number): Promise<Rect | null> {
  "use cache: remote";
  cacheLife("days");

  const data = await get<{ pages?: RawPage[] }>(`/flyers/${flyerId}`);
  const first = (data.pages ?? []).toSorted((a, b) => a.page - b.page)[0];
  return first ? toRect(first) : null;
}
