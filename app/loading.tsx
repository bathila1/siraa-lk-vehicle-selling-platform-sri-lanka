export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-56 bg-[var(--brand-deep)] opacity-80" />

      {/* Type icons */}
      <div className="border-b border-[var(--color-border)] py-8">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 w-16 flex-shrink-0 rounded-full bg-gray-200" />
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 h-6 w-40 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
