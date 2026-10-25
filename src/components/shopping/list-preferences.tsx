"use client";

import { useEffect, useId, useState } from "react";
import { normalizeItem } from "@/lib/shopping/shared";

type ListPreferencesProps = {
  postal: string | null;
  stores: string[];
  pantry: string[];
  connected: boolean;
  onStores: (stores: string[]) => void;
  onPantry: (items: string[]) => void;
};

function useStoreNames(postal: string | null) {
  const [names, setNames] = useState<string[] | null>(null);
  useEffect(() => {
    if (!postal) return;
    let live = true;
    fetch(`/api/stores?postal=${postal}`)
      .then((res) => (res.ok ? (res.json() as Promise<string[]>) : []))
      .then((list) => live && setNames(list))
      .catch(() => live && setNames([]));
    return () => {
      live = false;
    };
  }, [postal]);
  return names;
}

export function ListPreferences({ postal, stores, pantry, connected, onStores, onPantry }: ListPreferencesProps) {
  const names = useStoreNames(postal);
  const [draft, setDraft] = useState("");
  const pantryId = useId();
  const chosen = new Set(stores);

  const addPantry = () => {
    const added = draft.split(",").map(normalizeItem).filter(Boolean);
    if (added.length) onPantry([...pantry, ...added]);
    setDraft("");
  };

  return (
    <details className="group rounded-2xl border border-rule bg-shelf print:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-bold">Your stores and pantry</span>
          <span className="block text-sm text-muted">
            {connected ? "Synced with the Flyerwatch extension." : "Saved in this browser."}
          </span>
        </span>
        <span className="text-sm font-semibold text-muted group-open:hidden">Edit</span>
        <span className="hidden text-sm font-semibold text-muted group-open:inline">Close</span>
      </summary>
      <div className="grid gap-8 border-t border-rule p-5 md:grid-cols-2">
        <fieldset>
          <legend className="font-semibold">Your stores</legend>
          <p className="text-sm text-muted">The first trip only uses these.</p>
          {names === null ? (
            <p className="mt-3 text-sm text-muted">Finding stores near you</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {names.map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={chosen.has(name)}
                    onChange={(event) =>
                      onStores(event.target.checked ? [...stores, name] : stores.filter((s) => s !== name))
                    }
                    className="size-4 accent-ink"
                  />
                  {name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <div>
          <label htmlFor={pantryId} className="font-semibold">
            Pantry
          </label>
          <p className="text-sm text-muted">Things you always have. They&apos;re never searched.</p>
          {pantry.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {pantry.map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper py-1 pr-1 pl-3 text-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => onPantry(pantry.filter((other) => other !== item))}
                    aria-label={`Remove ${item}`}
                    className="grid size-6 place-items-center rounded-full text-muted hover:bg-rule hover:text-ink"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex gap-2">
            <input
              id={pantryId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addPantry();
                }
              }}
              placeholder="cumin, olive oil"
              className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addPantry}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
