import type { Metadata } from "next";
import { Suspense } from "react";
import { FlyerGrid } from "@/components/flyer-grid";
import { FlyerGridSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "Flyers | Flyerwatch" };

async function Grid({ searchParams }: { searchParams: PageProps<"/flyers">["searchParams"] }) {
  const { all } = await searchParams;
  return <FlyerGrid showAll={all === "1"} />;
}

export default function FlyersPage({ searchParams }: PageProps<"/flyers">) {
  return (
    <>
      <div className="pt-10 pb-8 sm:pt-16">
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight font-stretch-extra-condensed sm:text-7xl">
          This week&apos;s flyers
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted">Find a store or open a flyer to see every deal in it.</p>
      </div>
      <Suspense fallback={<FlyerGridSkeleton />}>
        <Grid searchParams={searchParams} />
      </Suspense>
    </>
  );
}
