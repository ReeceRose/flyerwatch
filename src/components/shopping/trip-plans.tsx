"use client";

import { formatMoney } from "@/lib/price";
import type { Plan, Trip } from "@/lib/shopping/shared";

export type PlanChoice = "yours" | "anywhere";

type TripPlansProps = {
  yours: Plan | null;
  anywhere: Plan | null;
  itemCount: number;
  choice: PlanChoice;
  onChoose: (choice: PlanChoice) => void;
  trip: Trip;
  onTrip: (trip: Trip) => void;
  loading: boolean;
};

function PlanCard({
  label,
  plan,
  itemCount,
  selected,
  onSelect,
}: {
  label: string;
  plan: Plan;
  itemCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="flex flex-col items-start rounded-2xl border-2 border-rule bg-shelf p-5 text-left transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-tag/30 print:hidden print:aria-pressed:flex"
    >
      <span className="text-sm font-semibold text-muted">{label}</span>
      <span className="mt-1 text-3xl font-black leading-[1.05] tracking-tight font-stretch-extra-condensed sm:text-4xl">
        {plan.stores.join(" + ")}
      </span>
      <span className="mt-3 text-lg">
        <span className="font-bold">
          {plan.covered} of {itemCount}
        </span>{" "}
        on sale
      </span>
      {plan.total > 0 ? (
        <span className="text-muted">
          About {formatMoney(plan.total)} at sale prices{plan.guesses > 0 ? ", some weights guessed" : ""}
        </span>
      ) : null}
    </button>
  );
}

export function TripPlans({ yours, anywhere, itemCount, choice, onChoose, trip, onTrip, loading }: TripPlansProps) {
  return (
    <section aria-labelledby="trip-heading" className="space-y-4">
      <h2 id="trip-heading" className="text-sm font-semibold text-muted print:hidden">
        Where to shop
      </h2>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
          <div className="h-40 animate-pulse rounded-2xl bg-shelf" />
          <div className="h-40 animate-pulse rounded-2xl bg-shelf" />
        </div>
      ) : yours || anywhere ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {yours ? (
            <PlanCard
              label="Your stores"
              plan={yours}
              itemCount={itemCount}
              selected={choice === "yours" || !anywhere}
              onSelect={() => onChoose("yours")}
            />
          ) : null}
          {anywhere ? (
            <PlanCard
              label={yours ? "Any store nearby" : "Best trip"}
              plan={anywhere}
              itemCount={itemCount}
              selected={choice === "anywhere" || !yours}
              onSelect={() => onChoose("anywhere")}
            />
          ) : null}
        </div>
      ) : (
        <p className="rounded-2xl bg-shelf p-5 text-lg">Nothing on your list is in a flyer this week.</p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm print:hidden">
        <div className="flex items-center gap-2" role="group" aria-label="Most stores per trip">
          <span className="text-muted">Visit up to</span>
          <div className="inline-flex rounded-full border border-rule bg-shelf p-0.5">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={trip.maxStores === n}
                onClick={() => onTrip({ ...trip, maxStores: n })}
                className="h-7 w-8 rounded-full font-semibold tabular-nums aria-pressed:bg-ink aria-pressed:text-paper"
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-muted">{trip.maxStores === 1 ? "store" : "stores"}</span>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={trip.compareAnywhere}
            onChange={(event) => onTrip({ ...trip, compareAnywhere: event.target.checked })}
            className="size-4 accent-ink"
          />
          Compare with any store nearby
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={trip.includeSimilar}
            onChange={(event) => onTrip({ ...trip, includeSimilar: event.target.checked })}
            className="size-4 accent-ink"
          />
          Count similar items
        </label>
      </div>
    </section>
  );
}
