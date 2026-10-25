"use client";

import { useEffect, useState } from "react";
import type { RankedDeal } from "@/lib/shopping/shared";

export type DealResult = { status: "loading" | "ready" | "failed"; deals: RankedDeal[] };

const cache = new Map<string, Promise<RankedDeal[]>>();

function fetchDeals(postal: string, term: string): Promise<RankedDeal[]> {
  const key = `${postal}|${term}`;
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
  const [results, setResults] = useState<Record<string, DealResult>>({});
  const key = terms.join("|");

  useEffect(() => {
    if (!postal) return;
    let live = true;
    const wanted = key ? key.split("|") : [];
    setResults((current) => {
      const next: Record<string, DealResult> = {};
      for (const term of wanted) next[term] = current[term] ?? { status: "loading", deals: [] };
      return next;
    });
    for (const term of wanted) {
      fetchDeals(postal, term).then(
        (deals) => live && setResults((current) => ({ ...current, [term]: { status: "ready", deals } })),
        () => live && setResults((current) => ({ ...current, [term]: { status: "failed", deals: [] } })),
      );
    }
    return () => {
      live = false;
    };
  }, [postal, key]);

  return results;
}
