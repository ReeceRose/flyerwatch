import { getFlyers } from "@/lib/flipp";
import { normalizePostal } from "@/lib/postal-code";

export async function GET(request: Request) {
  const postal = normalizePostal(new URL(request.url).searchParams.get("postal") ?? "");
  if (!postal) return Response.json({ error: "Send a postal code" }, { status: 400 });

  try {
    const flyers = await getFlyers(postal);
    const stores = [...new Set(flyers.filter((f) => f.categories.includes("Groceries")).map((f) => f.merchant))];
    return Response.json(stores.sort((a, b) => a.localeCompare(b)), {
      headers: { "cache-control": "public, max-age=3600, s-maxage=21600" },
    });
  } catch {
    return Response.json({ error: "Flipp didn't answer" }, { status: 502 });
  }
}
