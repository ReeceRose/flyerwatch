"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { POSTAL_COOKIE, normalizePostal } from "@/lib/postal";

export type PostalState = { error: string | null };

async function storePostal(code: string) {
  (await cookies()).set(POSTAL_COOKIE, code, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
}

/** Follows the postal code saved in the extension or this browser. */
export async function syncPostal(value: string): Promise<void> {
  const code = normalizePostal(value);
  if (!code) return;
  await storePostal(code);
  refresh();
}

export async function setPostal(_prev: PostalState, formData: FormData): Promise<PostalState> {
  const code = normalizePostal(String(formData.get("postal") ?? ""));
  if (!code) return { error: "Enter a Canadian postal code, like N2G 1A1." };

  await storePostal(code);
  refresh();
  return { error: null };
}
