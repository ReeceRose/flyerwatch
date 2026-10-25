import { PriceTag } from "@/components/price-tag";
import type { Deal } from "@/lib/flipp";
import { formatDay, tidyName } from "@/lib/format";
import { formatMoney, pricePerLb, unitLabel } from "@/lib/price";

export type DealRowProps = {
  deal: Deal;
  cheapest?: boolean;
  showStore?: boolean;
  onOpen: (deal: Deal) => void;
};

export function DealRow({ deal, cheapest = false, showStore = true, onOpen }: DealRowProps) {
  const perLb = pricePerLb(deal);
  const until = formatDay(deal.validTo);
  const unit = unitLabel(deal.postPriceText);
  const extraText = !unit && deal.postPriceText ? deal.postPriceText : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(deal)}
        className="group grid w-full grid-cols-[64px_1fr_auto] items-center gap-4 py-4 text-left sm:grid-cols-[80px_1fr_auto] sm:gap-5"
      >
        <span className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-shelf p-1.5">
          {deal.imageUrl ? (
            <img src={deal.imageUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
          ) : null}
        </span>
        <span className="min-w-0">
          {cheapest ? (
            <span className="mb-1 inline-block rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper">
              Cheapest this week
            </span>
          ) : null}
          <span className="block text-[17px] font-semibold leading-snug group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
            {tidyName(deal.name)}
          </span>
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted">
            {showStore ? <span className="font-semibold text-ink">{deal.merchant}</span> : null}
            {until ? <span>Until {until}</span> : null}
            {perLb !== null && unit !== "/lb" ? <span>{formatMoney(perLb)}/lb</span> : null}
          </span>
          {deal.saleStory || deal.originalPrice || extraText ? (
            <span className="mt-1 flex flex-wrap gap-x-3 text-sm">
              {deal.saleStory ? <span className="font-semibold text-sale">{deal.saleStory}</span> : null}
              {deal.originalPrice ? (
                <span className="text-muted line-through">{formatMoney(deal.originalPrice)}</span>
              ) : null}
              {extraText ? <span className="text-muted">{extraText}</span> : null}
            </span>
          ) : null}
        </span>
        <PriceTag deal={deal} />
      </button>
    </li>
  );
}
