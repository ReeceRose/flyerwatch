import { getFlyers, searchDeals } from "@/lib/flipp";
import { normalizePostal } from "@/lib/postal-code";
import { rankDeals } from "@/lib/shopping/shared";

const MAX_DEALS = 12;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const term = query.get("q")?.trim().toLowerCase() ?? "";
  const postal = normalizePostal(query.get("postal") ?? "");
  if (!term || !postal) return Response.json({ error: "Send a search word and a postal code" }, { status: 400 });

  try {
    const [flyers, deals] = await Promise.all([getFlyers(postal), searchDeals(postal, term)]);
    const grocery = new Set(flyers.filter((f) => f.categories.includes("Groceries")).map((f) => f.id));
    return Response.json(rankDeals(deals, term, grocery).slice(0, MAX_DEALS), {
      headers: { "cache-control": "private, max-age=1800" },
    });
  } catch {
    return Response.json({ error: "Flipp didn't answer" }, { status: 502 });
  }
}
