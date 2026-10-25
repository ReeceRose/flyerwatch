"use client";

import { useEffect, useRef } from "react";
import { syncPostal } from "@/lib/actions";
import { updateSettings, useShopping } from "@/lib/shopping/store";

/**
 * Keeps the postal code the server uses (a cookie) in step with the one saved
 * in the extension or this browser, so flyers and the shopping list agree.
 */
export function PostalSync({ serverPostal }: { serverPostal: string }) {
  const { ready, settings } = useShopping();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!settings.postal) {
      updateSettings({ postal: serverPostal });
      return;
    }
    if (settings.postal !== serverPostal && synced.current !== settings.postal) {
      synced.current = settings.postal;
      syncPostal(settings.postal);
    }
  }, [ready, settings.postal, serverPostal]);

  return null;
}
