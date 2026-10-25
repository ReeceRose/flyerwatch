"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FlyerDeals } from "@/components/flyer-deals";
import { FlyerPages } from "@/components/flyer-pages";
import type { Deal, FlyerPage } from "@/lib/flipp";

const VIEWS = [
  { key: "pages", label: "Flyer" },
  { key: "list", label: "List of deals" },
];

export function FlyerView({
  flyerId,
  postal,
  pages,
  deals,
}: {
  flyerId: number;
  postal: string;
  pages: FlyerPage[];
  deals: Deal[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = params.get("view") === "list" ? "list" : "pages";

  return (
    <>
      <div className="mb-8 inline-flex rounded-full border border-rule bg-shelf p-1" role="group" aria-label="View">
        {VIEWS.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={view === option.key}
            onClick={() => {
              const next = new URLSearchParams(params);
              if (option.key === "pages") next.delete("view");
              else next.set("view", "list");
              const query = next.toString();
              router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
            }}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted hover:text-ink aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {option.label}
          </button>
        ))}
      </div>
      {view === "list" ? (
        <FlyerDeals deals={deals} postal={postal} />
      ) : (
        <>
          <p className="mb-6 text-muted">Tap a deal on the page to see its price details.</p>
          <FlyerPages flyerId={flyerId} postal={postal} pages={pages} deals={deals} />
        </>
      )}
    </>
  );
}
