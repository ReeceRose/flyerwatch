"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { tidyName } from "@/lib/format";
import { dealPriceText, type StoreGroup } from "@/lib/shopping/groups";
import { encodeShare, type SharedList } from "@/lib/shopping/share";
import { describeNeed } from "@/lib/shopping/shared";

function toShared(groups: StoreGroup[], stores: string[]): SharedList {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    stores,
    total: groups.reduce((sum, group) => sum + group.subtotal, 0),
    groups: groups
      .filter((group) => group.items.length > 0)
      .map((group) => ({
        store: group.store,
        items: group.items.map(({ item, deal, estimate, elsewhere }) => ({
          name: item.term || item.uses[0]?.line || item.key,
          for: item.sources,
          need: describeNeed(item),
          deal: deal
            ? tidyName(deal.name)
            : elsewhere
              ? `On sale at ${elsewhere.merchant}, ${dealPriceText(elsewhere)}`
              : "Not on sale this week",
          price: deal ? dealPriceText(deal) : null,
          estimate: estimate?.amount ?? null,
        })),
      })),
  };
}

type ShareState = { url: string; qr: string } | null;

export function ShareDialog({ groups, stores, onClose }: { groups: StoreGroup[]; stores: string[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [share, setShare] = useState<ShareState>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
    let live = true;
    encodeShare(toShared(groups, stores)).then(async (code) => {
      const url = `${location.origin}/share#${code}`;
      const qr = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "L" });
      if (live) setShare({ url, qr });
    });
    return () => {
      live = false;
    };
  }, [groups, stores]);

  const copy = async () => {
    if (!share) return;
    await navigator.clipboard.writeText(share.url);
    setCopied(true);
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-3xl bg-paper p-0 text-ink"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-3xl font-black tracking-tight font-stretch-extra-condensed">Send to your phone</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="-mt-1 -mr-2 rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-shelf hover:text-ink"
          >
            Close
          </button>
        </div>
        <p className="mt-2 text-muted">
          Scan the code or send yourself the link. The whole list is inside the link, so nothing is saved online.
          Ticking items off on your phone stays on your phone.
        </p>
        {share ? (
          <>
            <div
              className="mx-auto mt-6 w-full max-w-72 rounded-2xl bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
              role="img"
              aria-label="QR code for the shopping list link"
              dangerouslySetInnerHTML={{ __html: share.qr }}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copy}
                className="rounded-xl bg-ink px-5 py-3 font-semibold text-paper hover:bg-ink/90"
              >
                {copied ? "Link copied" : "Copy link"}
              </button>
              {"share" in navigator ? (
                <button
                  type="button"
                  onClick={() => navigator.share({ title: "Shopping list", url: share.url }).catch(() => null)}
                  className="rounded-xl border-2 border-ink px-5 py-3 font-semibold hover:bg-shelf"
                >
                  Share
                </button>
              ) : null}
              <a
                href={share.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl px-3 py-3 font-semibold text-muted underline decoration-2 underline-offset-4 hover:text-ink"
              >
                Preview
              </a>
            </div>
          </>
        ) : (
          <div className="mx-auto mt-6 aspect-square w-full max-w-72 animate-pulse rounded-2xl bg-shelf" />
        )}
      </div>
    </dialog>
  );
}
