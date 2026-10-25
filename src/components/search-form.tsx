import Form from "next/form";

export function SearchForm({ query }: { query: string }) {
  return (
    <Form action="/" className="pt-10 pb-8 sm:pt-16">
      <label
        htmlFor="q"
        className="block text-5xl font-black leading-[0.95] tracking-tight font-stretch-extra-condensed sm:text-7xl"
      >
        What&apos;s on your list?
      </label>
      <p className="mt-3 max-w-xl text-lg text-muted">
        Search this week&apos;s flyers from every store near you and see who has it cheapest.
      </p>
      <div className="mt-6 flex max-w-2xl gap-2 rounded-2xl border-2 border-ink bg-shelf p-1.5 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ink">
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="chicken breast, butter, apples"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-3 text-xl outline-none placeholder:text-muted/70 focus-visible:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-ink px-5 py-3 text-base font-semibold text-paper hover:bg-ink/90"
        >
          Compare prices
        </button>
      </div>
    </Form>
  );
}
