"use client";

import Link from "next/link";
import { useDeferredValue, useId, useState } from "react";
import { FallbackImage } from "@/components/fallback-image";
import type { Flyer } from "@/lib/flipp";
import { formatRange } from "@/lib/format";
import { coverUrl } from "@/lib/images";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matches(flyer: Flyer, terms: string[]): boolean {
  const haystack = normalize(`${flyer.merchant} ${flyer.name}`);
  const squashed = haystack.replace(/ /g, "");
  return terms.every((term) => haystack.includes(term) || squashed.includes(term));
}

export function FlyerBrowser({ flyers, showAll }: { flyers: Flyer[]; showAll: boolean }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const inputId = useId();

  const terms = normalize(deferred).split(" ").filter(Boolean);
  const searching = terms.length > 0;
  const shown = searching
    ? flyers.filter((flyer) => matches(flyer, terms))
    : showAll
      ? flyers
      : flyers.filter((flyer) => flyer.categories.includes("Groceries"));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <label htmlFor={inputId} className="sr-only">
          Search flyers
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a store, like No Frills or Costco"
          autoComplete="off"
          className="w-full max-w-md rounded-xl border-2 border-ink bg-shelf px-4 py-2.5 text-lg"
        />
        {searching ? (
          <span className="text-muted" aria-live="polite">
            {shown.length === 1 ? "1 flyer" : `${shown.length} flyers`} from all {flyers.length}
          </span>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <p className="text-lg text-muted">
          No store near you matches &ldquo;{deferred}&rdquo;. Check the spelling, or try part of the name.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((flyer) => (
            <li key={flyer.id}>
              <Link href={`/flyers/${flyer.id}`} className="group block">
                <span className="block aspect-[3/4] overflow-hidden rounded-lg border border-rule bg-shelf transition-transform duration-200 group-hover:-rotate-1 group-hover:scale-[1.02] motion-reduce:transition-none">
                  <FallbackImage
                    src={coverUrl(flyer.id)}
                    fallback={flyer.thumbnailUrl}
                    className="h-full w-full object-cover object-top"
                  />
                </span>
                <span className="mt-3 block text-lg font-bold leading-tight">{flyer.merchant}</span>
                <span className="mt-0.5 block text-sm text-muted">
                  {formatRange(flyer.validFrom, flyer.validTo)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {searching ? null : (
        <p className="mt-12 text-muted">
          {showAll ? (
            <Link href="/flyers" className="font-semibold text-ink underline decoration-2 underline-offset-4">
              Show grocery stores only
            </Link>
          ) : (
            <Link href="/flyers?all=1" className="font-semibold text-ink underline decoration-2 underline-offset-4">
              Show all {flyers.length} flyers, including hardware and electronics
            </Link>
          )}
        </p>
      )}
    </>
  );
}
