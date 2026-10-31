"use client";

import { useState } from "react";
import { DealDialog } from "@/components/deal-dialog";
import { FlyerRegion } from "@/components/flyer-region";
import type { Deal, FlyerPage } from "@/lib/flipp";
import { tidyName } from "@/lib/format";
import type { TileSource } from "@/lib/tiles";

const PAGE_WIDTH = 1100;

function dealsOnPage(page: FlyerPage, deals: Deal[]): Deal[] {
  const { x, y, w, h } = page.rect;
  return deals.filter((deal) => {
    if (!deal.rect) return false;
    const cx = deal.rect.x + deal.rect.w / 2;
    const cy = deal.rect.y + deal.rect.h / 2;
    return cx >= x && cx < x + w && cy >= y && cy < y + h;
  });
}

function percent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

export function FlyerPages({
  source,
  pages,
  deals,
}: {
  source: TileSource | null;
  pages: FlyerPage[];
  deals: Deal[];
}) {
  const [open, setOpen] = useState<Deal | null>(null);

  if (pages.length === 0) {
    return <p className="text-lg text-muted">This flyer has no pages to show. Switch to the list of deals.</p>;
  }

  return (
    <>
      <ol className="mx-auto max-w-3xl space-y-10">
        {pages.map((page) => {
          const { rect } = page;
          return (
            <li key={page.page}>
              <div
                className="relative overflow-hidden rounded-lg border border-rule bg-shelf"
                style={{ aspectRatio: `${rect.w} / ${rect.h}` }}
              >
                {source ? (
                  <FlyerRegion
                    source={source}
                    rect={rect}
                    width={PAGE_WIDTH}
                    alt={`Page ${page.page}`}
                    loading={page.page <= 1 ? "eager" : "lazy"}
                    className="absolute! inset-0 h-full w-full"
                  />
                ) : null}
                {dealsOnPage(page, deals).map((deal) => {
                  const r = deal.rect;
                  if (!r) return null;
                  return (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => setOpen(deal)}
                      aria-label={tidyName(deal.name)}
                      title={tidyName(deal.name)}
                      className="absolute rounded-md outline-offset-0 transition-colors hover:bg-tag/25 hover:outline-3 hover:outline-ink focus-visible:bg-tag/25"
                      style={{
                        left: percent(r.x - rect.x, rect.w),
                        top: percent(r.y - rect.y, rect.h),
                        width: percent(r.w, rect.w),
                        height: percent(r.h, rect.h),
                      }}
                    />
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-muted">
                Page {page.page} of {pages.length}
              </p>
            </li>
          );
        })}
      </ol>
      <DealDialog deal={open} sources={source ? [source] : undefined} onClose={() => setOpen(null)} />
    </>
  );
}
