import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FlyerView } from "@/components/flyer-view";
import { ResultsSkeleton } from "@/components/skeletons";
import { getFlyer } from "@/lib/flipp";
import { formatRange } from "@/lib/format";
import { normalizePostal, readPostal } from "@/lib/postal";
import { tileSource } from "@/lib/tiles";

async function Flyer({ params, searchParams }: PageProps<"/flyers/[id]">) {
  const { id } = await params;
  const flyerId = Number.parseInt(id, 10);
  if (!Number.isFinite(flyerId)) notFound();

  // The extension links here with the postal code it found the deal under,
  // which can differ from the one this site has saved.
  const { postal: linked } = await searchParams;
  const postal = (typeof linked === "string" && normalizePostal(linked)) || (await readPostal());
  let data: Awaited<ReturnType<typeof getFlyer>>;
  try {
    data = await getFlyer(postal, flyerId);
  } catch {
    return <p className="mt-10 rounded-2xl bg-shelf p-6 text-lg">Flipp didn&apos;t answer. Reload in a minute.</p>;
  }

  const { flyer, deals, pages } = data;
  return (
    <>
      <div className="pt-10 pb-8 sm:pt-16">
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight font-stretch-extra-condensed sm:text-7xl">
          {flyer?.merchant ?? "Flyer"}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {flyer ? `${formatRange(flyer.validFrom, flyer.validTo)}, ` : ""}
          {pages.length} pages, {deals.length} deals
        </p>
      </div>
      <FlyerView source={flyer ? tileSource(flyer) : null} pages={pages} deals={deals} />
    </>
  );
}

export default function FlyerPage({ params, searchParams }: PageProps<"/flyers/[id]">) {
  return (
    <>
      <Link href="/flyers" className="mt-4 inline-block text-sm font-semibold text-muted hover:text-ink">
        All flyers
      </Link>
      <Suspense
        fallback={
          <div className="pt-10 sm:pt-16">
            <div className="mb-10 h-16 w-64 animate-pulse rounded-lg bg-rule" />
            <ResultsSkeleton />
          </div>
        }
      >
        <Flyer params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
