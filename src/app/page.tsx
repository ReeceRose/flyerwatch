import { Suspense } from "react";
import { SearchForm } from "@/components/search-form";
import { SearchResults } from "@/components/search-results";
import { ResultsSkeleton } from "@/components/skeletons";

type HomeProps = PageProps<"/">;

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

async function SearchArea({ searchParams }: { searchParams: HomeProps["searchParams"] }) {
  const params = await searchParams;
  const query = param(params.q);
  const store = param(params.store);
  const sort = param(params.sort) === "weight" ? "weight" : "price";

  return (
    <>
      <SearchForm query={query} />
      <Suspense key={`${query}|${store}|${sort}`} fallback={<ResultsSkeleton />}>
        <SearchResults query={query} store={store} sort={sort} />
      </Suspense>
    </>
  );
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <Suspense fallback={<SearchForm query="" />}>
      <SearchArea searchParams={searchParams} />
    </Suspense>
  );
}
