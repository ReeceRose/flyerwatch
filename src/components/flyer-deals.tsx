"use client";

import { useDeferredValue, useId, useState } from "react";
import { DealList } from "@/components/deal-list";
import type { Deal } from "@/lib/flipp";

export function FlyerDeals({ deals }: { deals: Deal[] }) {
  const [filter, setFilter] = useState("");
  const deferred = useDeferredValue(filter);
  const inputId = useId();

  const terms = deferred.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = terms.length
    ? deals.filter((deal) => terms.every((term) => deal.name.toLowerCase().includes(term)))
    : deals;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor={inputId} className="sr-only">
          Filter this flyer
        </label>
        <input
          id={inputId}
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter this flyer"
          className="w-full max-w-sm rounded-xl border-2 border-ink bg-shelf px-4 py-2.5 text-lg"
        />
        {terms.length ? (
          <span className="text-muted">
            {shown.length} of {deals.length}
          </span>
        ) : null}
      </div>
      {shown.length ? (
        <DealList deals={shown} showStore={false} />
      ) : (
        <p className="text-lg text-muted">Nothing in this flyer matches &ldquo;{deferred}&rdquo;.</p>
      )}
    </>
  );
}
