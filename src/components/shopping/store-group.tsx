"use client";

import { useId } from "react";
import { PriceTag } from "@/components/price-tag";
import { tidyName } from "@/lib/format";
import { formatMoney } from "@/lib/price";
import { dealPriceText, type GroupItem, type StoreGroup as Group } from "@/lib/shopping/groups";
import type { ListItem } from "@/lib/shopping/shared";

type ItemActions = {
  onRemove: (item: ListItem) => void;
  onPantry: (item: ListItem) => void;
};

function ItemRow({
  entry,
  checked,
  onToggle,
  onRemove,
  onPantry,
}: { entry: GroupItem; checked: boolean; onToggle: () => void } & ItemActions) {
  const id = useId();
  const { item, deal, estimate, elsewhere, status } = entry;
  const label = item.term || item.uses[0]?.line || item.key;

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-start gap-4 py-4 print:break-inside-avoid print:py-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-1 size-5 accent-ink print:size-4"
      />
      <div className={`min-w-0 ${checked ? "opacity-50" : ""}`}>
        <label htmlFor={id} className={`text-[17px] font-semibold capitalize ${checked ? "line-through" : ""}`}>
          {label}
        </label>
        {item.sources.length > 0 ? (
          <p className="text-sm text-muted">For {item.sources.join(", ")}</p>
        ) : null}
        {deal ? (
          <p className="mt-1 text-sm">
            {deal.tier > 0 ? <span className="font-semibold">Similar: </span> : null}
            {tidyName(deal.name)}
            <span className="hidden print:inline">, {dealPriceText(deal)}</span>
          </p>
        ) : status === "loading" ? (
          <p className="mt-1 text-sm text-muted">Checking flyers</p>
        ) : elsewhere ? (
          <p className="mt-1 text-sm text-muted">
            On sale at {elsewhere.merchant}, {dealPriceText(elsewhere)}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Not on sale this week</p>
        )}
        <div className="mt-1.5 flex gap-4 text-sm print:hidden">
          <button
            type="button"
            onClick={() => onPantry(item)}
            title="Never search for this again"
            className="font-semibold text-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            Add to pantry
          </button>
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="font-semibold text-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            Remove
          </button>
        </div>
      </div>
      {deal ? (
        <div className="flex flex-col items-end gap-1 print:hidden">
          <PriceTag deal={deal} size="sm" />
          {estimate ? (
            <span className="text-xs text-muted">
              {estimate.guess ? "about " : "≈ "}
              {formatMoney(estimate.amount)}
              {estimate.assumed ? ` for ${estimate.assumed}` : ""}
            </span>
          ) : null}
        </div>
      ) : (
        <span />
      )}
    </li>
  );
}

export function StoreGroup({
  group,
  checked,
  onToggle,
  onRemove,
  onPantry,
}: {
  group: Group;
  checked: Set<string>;
  onToggle: (key: string) => void;
} & ItemActions) {
  if (group.items.length === 0) return null;
  const left = group.items.filter((entry) => !checked.has(entry.item.key)).length;

  return (
    <section className="print:break-inside-avoid-page">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink pb-2">
        <h2 className="text-3xl font-black tracking-tight font-stretch-extra-condensed print:text-2xl">
          {group.store ?? "Buy anywhere"}
        </h2>
        <p className="text-muted">
          {left === group.items.length
            ? `${left} ${left === 1 ? "item" : "items"}`
            : `${left} of ${group.items.length} left`}
          {group.subtotal > 0 ? `, about ${formatMoney(group.subtotal)}` : ""}
        </p>
      </div>
      <ul className="divide-y divide-rule">
        {group.items.map((entry) => (
          <ItemRow
            key={entry.item.key}
            entry={entry}
            checked={checked.has(entry.item.key)}
            onToggle={() => onToggle(entry.item.key)}
            onRemove={onRemove}
            onPantry={onPantry}
          />
        ))}
      </ul>
    </section>
  );
}
