"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { setPostal, type PostalState } from "@/lib/actions";
import { normalizePostal } from "@/lib/postal-code";
import { updateSettings } from "@/lib/shopping/store";

const INITIAL: PostalState = { error: null };

export function PostalForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(setPostal, INITIAL);
  const details = useRef<HTMLDetailsElement>(null);
  const inputId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!pending && state.error === null && details.current) details.current.open = false;
  }, [pending, state]);

  return (
    <details ref={details} className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-rule bg-shelf px-3.5 py-1.5 text-sm [&::-webkit-details-marker]:hidden">
        <span className="text-muted">Near</span>
        <span className="font-semibold tabular-nums">{current}</span>
      </summary>
      <form
        action={action}
        onSubmit={(event) => {
          const code = normalizePostal(String(new FormData(event.currentTarget).get("postal") ?? ""));
          if (code) updateSettings({ postal: code });
        }}
        className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-rule bg-shelf p-4 shadow-[0_12px_32px_-12px_rgb(24_35_58/0.35)]"
      >
        <label htmlFor={inputId} className="block text-sm font-semibold">
          Your postal code
        </label>
        <p className="mt-0.5 text-sm text-muted">Flyers and prices follow your area.</p>
        <div className="mt-3 flex gap-2">
          <input
            id={inputId}
            name="postal"
            defaultValue={current}
            autoComplete="postal-code"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? errorId : undefined}
            className="w-full min-w-0 rounded-xl border border-rule bg-paper px-3 py-2 uppercase tabular-nums"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {pending ? "Saving" : "Save"}
          </button>
        </div>
        {state.error ? (
          <p id={errorId} className="mt-2 text-sm text-sale">
            {state.error}
          </p>
        ) : null}
      </form>
    </details>
  );
}
