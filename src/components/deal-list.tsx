"use client";

import { useState } from "react";
import { DealDialog } from "@/components/deal-dialog";
import { DealRow } from "@/components/deal-row";
import type { Deal } from "@/lib/flipp";

export type DealListProps = {
  deals: Deal[];
  highlightFirst?: boolean;
  showStore?: boolean;
};

export function DealList({ deals, highlightFirst = false, showStore = true }: DealListProps) {
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
      <DealDialog deal={open} onClose={() => setOpen(null)} />
    </>
  );
}
