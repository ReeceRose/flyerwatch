import "server-only";
import { cookies } from "next/headers";
import { normalizePostal } from "@/lib/postal-code";

export const POSTAL_COOKIE = "postal";
export const DEFAULT_POSTAL = "N2G1A1";

export { normalizePostal };

export async function readPostal(): Promise<string> {
  const stored = (await cookies()).get(POSTAL_COOKIE)?.value ?? "";
  return normalizePostal(stored) ?? DEFAULT_POSTAL;
}
