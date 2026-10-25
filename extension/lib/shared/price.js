const LB_PER_KG = 2.20462;

export function multiBuyCount(prePriceText) {
  const match = prePriceText?.match(/^\s*(\d+)\s*(\/|for)/i);
  const count = match ? Number.parseInt(match[1], 10) : 1;
  return count > 1 ? count : 1;
}

export function pricePerItem(deal) {
  if (deal.price === null) return null;
  return deal.price / multiBuyCount(deal.prePriceText);
}

export function pricePerLb(deal) {
  const each = pricePerItem(deal);
  const post = deal.postPriceText?.toLowerCase() ?? "";

  const quotedKg = post.match(/\$\s*(\d+(?:\.\d+)?)\s*\/\s*kg/);
  if (quotedKg) return Number.parseFloat(quotedKg[1]) / LB_PER_KG;

  const quotedLb = post.match(/\$\s*(\d+(?:\.\d+)?)\s*\/\s*lb/);
  if (quotedLb) return Number.parseFloat(quotedLb[1]);

  if (each === null) return null;
  if (/^\/?\s*lb\b/.test(post)) return each;
  if (/^\/?\s*kg\b/.test(post)) return each / LB_PER_KG;
  if (/^\/?\s*100\s*g\b/.test(post)) return (each * 10) / LB_PER_KG;
  return null;
}

export function unitLabel(postPriceText) {
  if (!postPriceText) return null;
  const short = postPriceText.trim().toLowerCase();
  if (/^\/?\s*lb$/.test(short)) return "/lb";
  if (/^\/?\s*kg$/.test(short)) return "/kg";
  if (/^\/?\s*100\s*g$/.test(short)) return "/100 g";
  if (/^\/pkg$/.test(short)) return "/pkg";
  if (/^(\/?\s*ea\.?|each)$/.test(short)) return "each";
  return null;
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
}

export function splitPrice(value) {
  const [dollars, cents] = value.toFixed(2).split(".");
  return { dollars, cents };
}
