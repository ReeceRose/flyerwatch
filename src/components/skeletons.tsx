export function ResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading deals">
      <div className="mb-5 h-5 w-48 animate-pulse rounded bg-rule" />
      <ul className="divide-y divide-rule border-y border-rule">
        {[0, 1, 2, 3, 4].map((index) => (
          <li
            key={`deal-row-skeleton-${index}`}
            className="grid grid-cols-[64px_1fr_auto] items-center gap-4 py-4 sm:grid-cols-[80px_1fr_auto] sm:gap-5"
          >
            <div className="aspect-square animate-pulse rounded-xl bg-shelf" />
            <div className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-rule" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-rule" />
            </div>
            <div className="h-16 w-24 animate-pulse rounded-md bg-tag/40" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FlyerGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <div key={`flyer-cover-skeleton-${index}`}>
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-shelf" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-rule" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-rule" />
        </div>
      ))}
    </div>
  );
}
