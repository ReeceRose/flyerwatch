"use client";

import { useMemo, useState } from "react";
import { ListPreferences } from "@/components/shopping/list-preferences";
import { ListRecipes } from "@/components/shopping/list-recipes";
import { ShareDialog } from "@/components/shopping/share-dialog";
import { StoreGroup } from "@/components/shopping/store-group";
import { type PlanChoice, TripPlans } from "@/components/shopping/trip-plans";
import { groupByPlan, planItems } from "@/lib/shopping/groups";
import { buildItems, type ListItem, pantryMatch, planTrips } from "@/lib/shopping/shared";
import { updateList, updatePantry, updateSettings, useShopping } from "@/lib/shopping/store";
import { useDeals } from "@/lib/shopping/use-deals";

function ItemLine({
  label,
  items,
  action,
  onClick,
}: {
  label: string;
  items: ListItem[];
  action: string;
  onClick: (item: ListItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <p>
      {label}:{" "}
      {items.map((item, index) => (
        <span key={item.key}>
          {index > 0 ? ", " : null}
          <button
            type="button"
            onClick={() => onClick(item)}
            title={`${action}: ${item.term}`}
            className="font-semibold text-ink underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink"
          >
            {item.term}
          </button>
        </span>
      ))}
      <span className="ml-2">(tap one to {action.toLowerCase()})</span>
    </p>
  );
}

export function ShoppingList({ serverPostal }: { serverPostal: string }) {
  const shop = useShopping();
  const { settings, pantry, list } = shop;
  const postal = settings.postal ?? serverPostal;
  const [choice, setChoice] = useState<PlanChoice>("yours");
  const [sharing, setSharing] = useState(false);

  const items = useMemo(() => buildItems(list.recipes, list.extras, pantry), [list.recipes, list.extras, pantry]);
  const removed = useMemo(() => new Set(list.removed), [list.removed]);
  const searchable = useMemo(
    () => items.filter((item) => !item.skipped && item.term && !removed.has(item.key)),
    [items, removed],
  );
  const inPantry = items.filter((item) => item.skipped === "pantry");
  const staples = items.filter((item) => item.skipped === "staple");
  const removedItems = items.filter((item) => !item.skipped && removed.has(item.key));
  const terms = useMemo(() => [...new Set(searchable.map((item) => item.term))], [searchable]);

  const results = useDeals(shop.ready ? postal : null, terms);
  const loading = searchable.some((item) => (results[item.term]?.status ?? "loading") === "loading");

  const plans = useMemo(
    () => (loading ? { yours: null, anywhere: null } : planTrips(planItems(searchable, results), settings)),
    [loading, searchable, results, settings],
  );
  const plan = choice === "yours" ? (plans.yours ?? plans.anywhere) : (plans.anywhere ?? plans.yours);
  const groups = useMemo(() => groupByPlan(searchable, results, plan), [searchable, results, plan]);
  const checked = useMemo(() => new Set(list.checked), [list.checked]);

  const toggle = (key: string) =>
    updateList((current) => ({
      ...current,
      checked: current.checked.includes(key) ? current.checked.filter((k) => k !== key) : [...current.checked, key],
    }));

  const removeItem = (item: ListItem) =>
    updateList((current) =>
      item.sources.length === 0
        ? { ...current, extras: current.extras.filter((extra) => extra.toLowerCase() !== item.uses[0]?.line.toLowerCase()) }
        : { ...current, removed: [...new Set([...current.removed, item.key])] },
    );
  const restoreItem = (item: ListItem) =>
    updateList((current) => ({ ...current, removed: current.removed.filter((key) => key !== item.key) }));
  const addToPantry = (item: ListItem) => updatePantry([...pantry, item.term]);
  const removeFromPantry = (item: ListItem) => {
    const entry = pantryMatch(item.term, pantry);
    updatePantry(pantry.filter((other) => other !== entry));
  };

  if (!shop.ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-shelf" aria-busy="true" />;
  }

  const empty = list.recipes.length === 0 && list.extras.length === 0;

  return (
    <div className="space-y-12 print:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <p className="text-lg text-muted">
          {empty
            ? "Nothing on your list yet."
            : `${list.recipes.length} ${list.recipes.length === 1 ? "recipe" : "recipes"}, ${searchable.length} items to buy`}
        </p>
        {empty ? null : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl border-2 border-ink px-4 py-2 font-semibold hover:bg-shelf"
            >
              Print
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setSharing(true)}
              className="rounded-xl bg-ink px-4 py-2 font-semibold text-paper hover:bg-ink/90 disabled:opacity-50"
            >
              Send to phone
            </button>
            <button
              type="button"
              onClick={() => updateList(() => ({ recipes: [], extras: [], checked: [], removed: [] }))}
              className="rounded-xl px-3 py-2 font-semibold text-muted hover:bg-shelf hover:text-ink"
            >
              Clear list
            </button>
          </div>
        )}
      </div>

      {empty ? (
        <div className="max-w-xl rounded-2xl bg-shelf p-6 text-lg">
          <p>
            Open a recipe in Chrome, click the Flyerwatch extension, and choose{" "}
            <span className="font-semibold">Add to shopping list</span>. Recipes you add show up here with the best
            stores to buy everything at.
          </p>
          {shop.connected ? null : (
            <p className="mt-3 text-base text-muted">
              Already have the extension? Open its settings and connect it to this site.
            </p>
          )}
        </div>
      ) : (
        <>
          <TripPlans
            yours={plans.yours}
            anywhere={plans.anywhere}
            itemCount={searchable.length}
            choice={choice}
            onChoose={setChoice}
            trip={settings.trip}
            onTrip={(trip) => updateSettings({ trip })}
            loading={loading}
          />

          <div className="space-y-10 print:space-y-5">
            {groups.map((group) => (
              <StoreGroup
                key={group.store ?? "anywhere"}
                group={group}
                checked={checked}
                onToggle={toggle}
                onRemove={removeItem}
                onPantry={addToPantry}
              />
            ))}
          </div>

          <div className="space-y-2 text-sm text-muted print:hidden">
            <ItemLine label="Removed from this list" items={removedItems} action="Put back" onClick={restoreItem} />
            <ItemLine label="In your pantry" items={inPantry} action="Take out of pantry" onClick={removeFromPantry} />
            {staples.length > 0 ? (
              <p>Always skipped: {staples.map((item) => item.term || item.key).join(", ")}</p>
            ) : null}
          </div>
        </>
      )}

      <ListRecipes
        recipes={list.recipes}
        extras={list.extras}
        onRemoveRecipe={(id) =>
          updateList((current) => ({ ...current, recipes: current.recipes.filter((recipe) => recipe.id !== id) }))
        }
        onAddExtra={(text) =>
          updateList((current) => ({ ...current, extras: [...new Set([...current.extras, text])] }))
        }
        onRemoveExtra={(text) =>
          updateList((current) => ({ ...current, extras: current.extras.filter((extra) => extra !== text) }))
        }
      />

      <ListPreferences
        postal={postal}
        stores={settings.stores}
        pantry={pantry}
        connected={shop.connected}
        onStores={(stores) => updateSettings({ stores })}
        onPantry={updatePantry}
      />

      {sharing ? <ShareDialog groups={groups} stores={plan?.stores ?? []} onClose={() => setSharing(false)} /> : null}
    </div>
  );
}
