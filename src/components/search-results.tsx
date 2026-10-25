import Link from "next/link";
import type { ReactNode } from "react";
import { DealList } from "@/components/deal-list";
import { type Deal, searchDeals } from "@/lib/flipp";
import { pricePerItem, pricePerLb } from "@/lib/price";
import { readPostal } from "@/lib/postal";

type Sort = "price" | "weight";

const STAPLES = ["eggs", "butter", "chicken breast", "ground beef", "milk", "apples", "coffee", "bread"];

function byValue(get: (deal: Deal) => number | null) {
  return (a: Deal, b: Deal) => {
    const x = get(a);
    const y = get(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return x - y;
  };
}

function href(query: string, store: string, sort: Sort) {
  const params = new URLSearchParams({ q: query });
  if (store) params.set("store", store);
  if (sort !== "price") params.set("sort", sort);
  return `/?${params}`;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className="rounded-full border border-rule bg-shelf px-3 py-1 text-sm font-medium text-ink hover:border-ink aria-[current=true]:border-ink aria-[current=true]:bg-ink aria-[current=true]:text-paper"
    >
      {children}
    </Link>
  );
}

export async function SearchResults({ query, store, sort }: { query: string; store: string; sort: Sort }) {
  if (!query) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-muted">Try a staple</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAPLES.map((item) => (
            <Chip key={item} href={href(item, "", "price")} active={false}>
              {item}
            </Chip>
          ))}
        </div>
        <p className="mt-10 text-muted">
          Want the whole thing?{" "}
          <Link href="/flyers" className="font-semibold text-ink underline decoration-2 underline-offset-4">
            Browse this week&apos;s flyers
          </Link>
        </p>
      </section>
    );
  }

  const postal = await readPostal();
  let deals: Deal[];
  try {
    deals = await searchDeals(postal, query);
  } catch {
    return (
      <p className="rounded-2xl bg-shelf p-6 text-lg">
        Flipp didn&apos;t answer. Search again in a minute.
      </p>
    );
  }

  if (deals.length === 0) {
    return (
      <p className="text-lg text-muted">
        No flyer has &ldquo;{query}&rdquo; this week. Try a shorter or more general word, like &ldquo;
        {query.split(" ").at(-1)}&rdquo;.
      </p>
    );
  }

  const stores = [...new Map(deals.map((d) => [d.merchant, deals.filter((x) => x.merchant === d.merchant).length]))]
    .sort((a, b) => a[0].localeCompare(b[0]));
  const filtered = store ? deals.filter((d) => d.merchant === store) : deals;
  const sorted = [...filtered].sort(byValue(sort === "weight" ? pricePerLb : pricePerItem));
  const weighable = deals.some((d) => pricePerLb(d) !== null);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg">
          <span className="font-bold">{filtered.length} deals</span>{" "}
          <span className="text-muted">
            {store ? `at ${store}` : `at ${stores.length} stores`}
          </span>
        </h2>
        {weighable ? (
          <div className="flex gap-1.5" role="group" aria-label="Sort">
            <Chip href={href(query, store, "price")} active={sort === "price"}>
              Lowest price
            </Chip>
            <Chip href={href(query, store, "weight")} active={sort === "weight"}>
              Lowest per lb
            </Chip>
          </div>
        ) : null}
      </div>
      {stores.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <Chip href={href(query, "", sort)} active={!store}>
            All stores
          </Chip>
          {stores.map(([name, count]) => (
            <Chip key={name} href={href(query, name, sort)} active={store === name}>
              {name} <span className="opacity-60">{count}</span>
            </Chip>
          ))}
        </div>
      ) : null}
      <DealList deals={sorted} highlightFirst />
      {sort === "weight" ? (
        <p className="mt-4 text-sm text-muted">
          Per-pound prices are worked out from the flyer&apos;s units. Items sold by the package go last.
        </p>
      ) : null}
    </section>
  );
}
