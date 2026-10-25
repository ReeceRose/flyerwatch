import type { Deal } from "@/lib/flipp";
import * as shared from "@/shared/price";

export const multiBuyCount: (prePriceText: string | null) => number = shared.multiBuyCount;
export const pricePerItem: (deal: Deal) => number | null = shared.pricePerItem;
export const pricePerLb: (deal: Deal) => number | null = shared.pricePerLb;
export const unitLabel: (postPriceText: string | null) => string | null = shared.unitLabel;
export const formatMoney: (value: number) => string = shared.formatMoney;
export const splitPrice: (value: number) => { dollars: string; cents: string } = shared.splitPrice;
