import { FlyerBrowser } from "@/components/flyer-browser";
import { type Flyer, getFirstPage, getFlyers } from "@/lib/flipp";
import { readPostal } from "@/lib/postal";
import { coverRect } from "@/lib/tiles";

export async function FlyerGrid({ showAll }: { showAll: boolean }) {
  const postal = await readPostal();
  let flyers: Flyer[];
  try {
    flyers = await getFlyers(postal);
  } catch {
    return <p className="rounded-2xl bg-shelf p-6 text-lg">Flipp didn&apos;t answer. Reload in a minute.</p>;
  }

  if (flyers.length === 0) {
    return <p className="text-lg text-muted">No flyers for this postal code. Try a nearby one.</p>;
  }

  // A flyer without a known first page shows Flipp's thumbnail instead.
  const firstPages = await Promise.all(flyers.map((flyer) => getFirstPage(flyer.id).catch(() => null)));
  const covers = Object.fromEntries(
    flyers.flatMap((flyer, i) => {
      const page = firstPages[i];
      return page ? [[flyer.id, coverRect(page)]] : [];
    }),
  );

  return (
    <FlyerBrowser
      flyers={flyers.toSorted((a, b) => a.merchant.localeCompare(b.merchant))}
      covers={covers}
      showAll={showAll}
    />
  );
}
