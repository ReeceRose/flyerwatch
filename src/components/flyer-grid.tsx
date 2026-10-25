import { FlyerBrowser } from "@/components/flyer-browser";
import { type Flyer, getFlyers } from "@/lib/flipp";
import { readPostal } from "@/lib/postal";

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

  return (
    <FlyerBrowser flyers={flyers.toSorted((a, b) => a.merchant.localeCompare(b.merchant))} showAll={showAll} />
  );
}
