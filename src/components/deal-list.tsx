"use client";

import { useState } from "react";
import { DealDialog } from "@/components/deal-dialog";
import { DealRow } from "@/components/deal-row";
import type { Deal } from "@/lib/flipp";
import type { TileSource } from "@/lib/tiles";

export type DealListProps = {
  deals: Deal[];
  highlightFirst?: boolean;
  showStore?: boolean;
  /** Tiles of the flyers these deals come from. */
  sources?: TileSource[];
};

export function DealList({ deals, highlightFirst = false, showStore = true, sources }: DealListProps) {
  const [open, setOpen] = useState<Deal | null>(null);

  return (
    <>
      <ul className="divide-y divide-rule border-y border-rule">
        {deals.map((deal, index) => (
          <DealRow
            key={deal.id}
            deal={deal}
            cheapest={highlightFirst && index === 0 && deal.price !== null}
            showStore={showStore}
            onOpen={setOpen}
          />
        ))}
      </ul>
      <DealDialog deal={open} sources={sources} onClose={() => setOpen(null)} />
    </>
  );
}
