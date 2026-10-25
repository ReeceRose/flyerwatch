"use client";

import { useId, useState } from "react";
import type { ListRecipe } from "@/lib/shopping/shared";

type ListRecipesProps = {
  recipes: ListRecipe[];
  extras: string[];
  onRemoveRecipe: (id: string) => void;
  onAddExtra: (text: string) => void;
  onRemoveExtra: (text: string) => void;
};

// Recipes come from the extension's storage, so only web links become links.
function webLink(url: string): string | undefined {
  try {
    return /^https?:$/.test(new URL(url).protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

export function ListRecipes({ recipes, extras, onRemoveRecipe, onAddExtra, onRemoveExtra }: ListRecipesProps) {
  const [draft, setDraft] = useState("");
  const inputId = useId();

  return (
    <section className="space-y-6 print:hidden">
      <div>
        <h2 className="text-sm font-semibold text-muted">Recipes</h2>
        {recipes.length > 0 ? (
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <a
                    href={webLink(recipe.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold hover:underline hover:decoration-2 hover:underline-offset-4"
                  >
                    {recipe.title}
                  </a>
                  <p className="text-sm text-muted">
                    {recipe.site}, {recipe.ingredients.length} ingredients
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveRecipe(recipe.id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-shelf hover:text-ink"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted">No recipes yet.</p>
        )}
      </div>

      <div>
        <label htmlFor={inputId} className="text-sm font-semibold text-muted">
          Something else to buy
        </label>
        <form
          className="mt-2 flex max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) onAddExtra(draft.trim());
            setDraft("");
          }}
        >
          <input
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="paper towels, coffee"
            className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-shelf px-3 py-2"
          />
          <button type="submit" className="rounded-xl bg-ink px-4 py-2 font-semibold text-paper hover:bg-ink/90">
            Add
          </button>
        </form>
        {extras.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {extras.map((extra) => (
              <li
                key={extra}
                className="inline-flex items-center gap-1 rounded-full border border-rule bg-shelf py-1 pr-1 pl-3 text-sm"
              >
                {extra}
                <button
                  type="button"
                  onClick={() => onRemoveExtra(extra)}
                  aria-label={`Remove ${extra}`}
                  className="grid size-6 place-items-center rounded-full text-muted hover:bg-rule hover:text-ink"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
