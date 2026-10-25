import { getDealDetail } from "@/lib/flipp";

export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const { id } = await ctx.params;
  const itemId = Number.parseInt(id, 10);
  if (!Number.isFinite(itemId)) return Response.json({ error: "Invalid item id" }, { status: 400 });

  try {
    return Response.json(await getDealDetail(itemId));
  } catch {
    return Response.json({ error: "Flipp didn't return this item" }, { status: 502 });
  }
}
