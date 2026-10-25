"use client";

import { useEffect, useRef, useState } from "react";
import { FallbackImage } from "@/components/fallback-image";
import { PriceTag } from "@/components/price-tag";
import type { Deal, DealDetail } from "@/lib/flipp";
import { formatDay, tidyName } from "@/lib/format";
import { dealImageUrl } from "@/lib/images";
import { formatMoney, pricePerItem, pricePerLb } from "@/lib/price";

type Status = "idle" | "loading" | "ready" | "failed";

export function DealDialog({
  deal,
  postal,
  onClose,
}: {
  deal: Deal | null;
  postal?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<DealDetail | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (deal && !dialog.open) dialog.showModal();
    if (!deal && dialog.open) dialog.close();
  }, [deal]);

  useEffect(() => {
    if (!deal) return;
    const controller = new AbortController();
    setDetail(null);
    setStatus("loading");
    fetch(`/api/items/${deal.id}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<DealDetail>) : Promise.reject(res)))
      .then((data) => {
        setDetail(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("failed");
      });
    return () => controller.abort();
  }, [deal]);

  const shown: Deal | null = deal
    ? {
        ...deal,
        ...(detail
          ? {
              prePriceText: detail.prePriceText ?? deal.prePriceText,
              postPriceText: deal.postPriceText ?? detail.priceText,
              saleStory: detail.saleStory ?? deal.saleStory,
            }
          : {}),
      }
    : null;

  const each = shown ? pricePerItem(shown) : null;
  const perLb = shown ? pricePerLb(shown) : null;
  const multi = shown?.prePriceText && each !== null && shown.price !== each;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-3xl bg-paper p-0 text-ink"
    >
      {shown ? (
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold">
              {shown.merchant}
              {shown.validTo ? (
                <span className="font-normal text-muted"> until {formatDay(shown.validTo)}</span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-2 rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-shelf hover:text-ink"
            >
              Close
            </button>
          </div>

          <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight font-stretch-condensed">
            {tidyName(shown.name)}
          </h2>
          {detail?.description ? <p className="mt-1 text-muted">{tidyName(detail.description)}</p> : null}

          <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-6">
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-shelf p-4">
              <FallbackImage
                src={dealImageUrl(shown, 900, postal)}
                fallback={shown.imageUrl}
                loading="eager"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="tag-drop" key={status}>
              <PriceTag deal={shown} size="lg" />
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px]">
            {multi && each !== null ? (
              <>
                <dt className="text-muted">Each</dt>
                <dd className="font-semibold">{formatMoney(each)}</dd>
              </>
            ) : null}
            {perLb !== null ? (
              <>
                <dt className="text-muted">By weight</dt>
                <dd className="font-semibold">
                  {formatMoney(perLb)}/lb ({formatMoney(perLb * 2.20462)}/kg)
                </dd>
              </>
            ) : null}
            {detail?.priceText ? (
              <>
                <dt className="text-muted">Flyer says</dt>
                <dd>{detail.priceText}</dd>
              </>
            ) : null}
            {shown.saleStory ? (
              <>
                <dt className="text-muted">Deal</dt>
                <dd className="font-semibold text-sale">{shown.saleStory}</dd>
              </>
            ) : null}
            {shown.originalPrice ? (
              <>
                <dt className="text-muted">Usually</dt>
                <dd>{formatMoney(shown.originalPrice)}</dd>
              </>
            ) : null}
          </dl>

          {status === "loading" ? <p className="mt-4 text-sm text-muted">Checking the flyer for details</p> : null}
          {status === "failed" ? (
            <p className="mt-4 text-sm text-sale">
              Couldn&apos;t load the full deal. The price above is from the flyer listing.
            </p>
          ) : null}
          {detail?.disclaimer ? <p className="mt-4 text-sm text-muted">{detail.disclaimer}</p> : null}

          {detail?.storeUrl ? (
            <a
              href={detail.storeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-xl bg-ink px-5 py-3 font-semibold text-paper hover:bg-ink/90"
            >
              View on {shown.merchant}
            </a>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
