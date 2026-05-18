import { Header } from '@/components/shared/Header';

export default function SearchLoading() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Filter skeleton */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3">
              <div className="h-4 w-24 skeleton rounded" />
              <div className="h-9 w-full skeleton rounded" />
              <div className="h-9 w-full skeleton rounded" />
              <div className="h-9 w-full skeleton rounded" />
            </div>
          </aside>

          {/* Results skeleton */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <div className="aspect-[4/3] skeleton" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 w-3/4 skeleton rounded" />
                    <div className="h-4 w-1/2 skeleton rounded" />
                    <div className="h-3 w-2/3 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
