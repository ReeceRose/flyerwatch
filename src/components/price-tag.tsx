import type { Deal } from "@/lib/flipp";
import { multiBuyCount, splitPrice, unitLabel } from "@/lib/price";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { box: string; dollars: string; cents: string; sign: string }> = {
  sm: { box: "min-w-16 px-2 pt-1 pb-1.5", dollars: "text-[28px]", cents: "text-sm", sign: "text-xs" },
  md: { box: "min-w-24 px-3 pt-1.5 pb-2", dollars: "text-[44px]", cents: "text-xl", sign: "text-lg" },
  lg: { box: "min-w-36 px-4 pt-2 pb-3", dollars: "text-[72px]", cents: "text-3xl", sign: "text-2xl" },
};

export function PriceTag({ deal, size = "md" }: { deal: Deal; size?: Size }) {
  const s = SIZES[size];
  const count = multiBuyCount(deal.prePriceText);
  const unit = unitLabel(deal.postPriceText);

  if (deal.price === null) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-md border-b-4 border-tag-edge bg-tag text-ink ${s.box}`}
      >
        <span
          className={`${size === "sm" ? "text-xs" : "text-lg"} text-center font-extrabold leading-tight font-stretch-condensed`}
        >
          {deal.saleStory ?? "See flyer"}
        </span>
      </div>
    );
  }

  const { dollars, cents } = splitPrice(deal.price);

  return (
    <div
      className={`flex flex-col items-center rounded-md border-b-4 border-tag-edge bg-tag text-ink ${s.box}`}
    >
      {count > 1 ? (
        <span className={`${size === "sm" ? "text-[11px]" : "text-sm"} font-bold leading-none`}>{count} for</span>
      ) : null}
      <span className="flex items-start font-black leading-none tabular-nums font-stretch-extra-condensed">
        <span className={`${s.sign} mt-[0.2em]`}>$</span>
        <span className={s.dollars}>{dollars}</span>
        <span className={`${s.cents} mt-[0.15em] ml-0.5`}>{cents}</span>
      </span>
      {unit ? (
        <span className={`${size === "sm" ? "text-[11px]" : "text-sm"} font-semibold leading-none`}>{unit}</span>
      ) : null}
    </div>
  );
}
