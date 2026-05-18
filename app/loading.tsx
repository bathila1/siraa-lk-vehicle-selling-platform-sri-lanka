export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-56 bg-[var(--brand-deep)] opacity-80" />

      {/* Type icons */}
      <div className="py-8 border-b border-[var(--color-border)]">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="container mx-auto px-4 py-10">
        <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-[var(--color-border)]">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
