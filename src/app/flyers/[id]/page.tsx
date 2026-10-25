import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FlyerView } from "@/components/flyer-view";
import { ResultsSkeleton } from "@/components/skeletons";
import { getFlyer } from "@/lib/flipp";
import { formatRange } from "@/lib/format";
import { readPostal } from "@/lib/postal";

async function Flyer({ params }: { params: PageProps<"/flyers/[id]">["params"] }) {
  const { id } = await params;
  const flyerId = Number.parseInt(id, 10);
  if (!Number.isFinite(flyerId)) notFound();

  const postal = await readPostal();
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
      <FlyerView flyerId={flyerId} pages={pages} deals={deals} />
    </>
  );
}

export default function FlyerPage({ params }: PageProps<"/flyers/[id]">) {
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
        <Flyer params={params} />
      </Suspense>
    </>
  );
}
