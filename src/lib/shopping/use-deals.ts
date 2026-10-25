"use client";

import { useEffect, useState } from "react";
import type { RankedDeal } from "@/lib/shopping/shared";

export type DealResult = { status: "loading" | "ready" | "failed"; deals: RankedDeal[] };

const cache = new Map<string, Promise<RankedDeal[]>>();
const NONE: Record<string, DealResult> = {};

function fetchDeals(postal: string, term: string): Promise<RankedDeal[]> {
  const key = JSON.stringify([postal, term]);
  const hit = cache.get(key);
  if (hit) return hit;

  const params = new URLSearchParams({ q: term, postal });
  const promise = fetch(`/api/deals?${params}`).then((res) =>
    res.ok ? (res.json() as Promise<RankedDeal[]>) : Promise.reject(new Error(`Deals failed for ${term}`)),
  );
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}

/** Deals for every search word, keyed by word. Words already fetched are reused. */
export function useDeals(postal: string | null, terms: string[]): Record<string, DealResult> {
  // Results remember which postal code they're for, so a new one starts over
  // instead of showing the old area's deals as ready.
  const [results, setResults] = useState<{ postal: string | null; byTerm: Record<string, DealResult> }>({
    postal: null,
    byTerm: {},
  });
  const key = JSON.stringify(terms);

  useEffect(() => {
    if (!postal) return;
    let live = true;
    const wanted = JSON.parse(key) as string[];
    setResults((current) => {
      const kept = current.postal === postal ? current.byTerm : {};
      const byTerm: Record<string, DealResult> = {};
      for (const term of wanted) byTerm[term] = kept[term] ?? { status: "loading", deals: [] };
      return { postal, byTerm };
    });
    const settle = (term: string, result: DealResult) =>
      live && setResults((current) => ({ postal, byTerm: { ...current.byTerm, [term]: result } }));
    for (const term of wanted) {
      fetchDeals(postal, term).then(
        (deals) => settle(term, { status: "ready", deals }),
        () => settle(term, { status: "failed", deals: [] }),
      );
    }
    return () => {
      live = false;
    };
  }, [postal, key]);

  return results.postal === postal ? results.byTerm : NONE;
}
