import { formatMoney, multiBuyCount, unitLabel } from "@/lib/price";
import type { DealResult } from "@/lib/shopping/use-deals";
import {
  estimateCost,
  type Estimate,
  type ListItem,
  type Plan,
  type PlanItem,
  type RankedDeal,
  type ShoppingList,
  withoutWrong,
} from "@/lib/shopping/shared";

export type GroupItem = {
  item: ListItem;
  status: DealResult["status"];
  deal: RankedDeal | null;
  estimate: Estimate | null;
  elsewhere: RankedDeal | null;
};

export type StoreGroup = { store: string | null; items: GroupItem[]; subtotal: number };

type Skips = Pick<ShoppingList, "notAt" | "wrong">;

/** An item's deals, leaving out stores you said not to buy it at and items marked wrong. */
function dealsFor(item: ListItem, result: DealResult, { notAt, wrong }: Skips): RankedDeal[] {
  const skip = notAt[item.key];
  const deals = withoutWrong(result.deals, wrong, item.term);
  return skip ? deals.filter((deal) => !skip.includes(deal.merchant)) : deals;
}

export function planItems(items: ListItem[], results: Record<string, DealResult>, skips: Skips): PlanItem[] {
  return items
    .filter((item) => results[item.term]?.status === "ready")
    .map((item) => ({ key: item.key, deals: dealsFor(item, results[item.term], skips), amount: item.amount }));
}

/** Items grouped by the store the plan sends them to; everything else goes in a final group. */
export function groupByPlan(
  items: ListItem[],
  results: Record<string, DealResult>,
  plan: Plan | null,
  skips: Skips,
): StoreGroup[] {
  const stores = plan?.stores ?? [];
  const groups = new Map<string | null, GroupItem[]>();
  for (const store of stores) groups.set(store, []);
  groups.set(null, []);

  for (const item of items) {
    const result = results[item.term] ?? { status: "loading", deals: [] };
    const deal = plan?.assignments[item.key] ?? null;
    const elsewhere = deal ? null : (dealsFor(item, result, skips).find((d) => d.tier === 0 && !stores.includes(d.merchant)) ?? null);
    groups.get(deal ? deal.merchant : null)?.push({
      item,
      status: result.status,
      deal,
      estimate: deal ? estimateCost(deal, item.amount, item.term) : null,
      elsewhere,
    });
  }

  return [...groups].map(([store, groupItems]) => ({
    store,
    items: groupItems,
    subtotal: groupItems.reduce((sum, entry) => sum + (entry.estimate?.amount ?? 0), 0),
  }));
}

export function dealPriceText(deal: RankedDeal): string | null {
  if (deal.price === null) return deal.saleStory;
  const count = multiBuyCount(deal.prePriceText);
  if (count > 1) return `${count} for ${formatMoney(deal.price)}`;
  const unit = unitLabel(deal.postPriceText);
  return `${formatMoney(deal.price)}${unit && unit !== "each" ? unit : ""}`;
}
