"use client";

import { useEffect, useState } from "react";

export type OfflineCopy = "saving" | "ready" | "unavailable";

function loadedFiles(): string[] {
  const resources = performance.getEntriesByType("resource").map((entry) => entry.name);
  const scripts = [...document.scripts].map((script) => script.src).filter(Boolean);
  const links = [...document.querySelectorAll<HTMLLinkElement>("link[href]")].map((link) => link.href);
  return [...resources, ...scripts, ...links];
}

/**
 * Saves the share page on this phone through public/sw.js, so the list opens
 * again without signal. Only in production builds over https (or localhost);
 * in development the saved files would go stale as code changes.
 */
export function useOfflineCopy(): OfflineCopy {
  const [state, setState] = useState<OfflineCopy>("saving");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !window.isSecureContext) {
      setState("unavailable");
      return;
    }
    let live = true;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/share", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event: MessageEvent<{ saved: boolean }>) => {
          if (live) setState(event.data.saved ? "ready" : "unavailable");
        };
        registration.active?.postMessage({ type: "save-share-page", urls: loadedFiles() }, [channel.port2]);
      })
      .catch(() => live && setState("unavailable"));
    return () => {
      live = false;
    };
  }, []);

  return state;
}
