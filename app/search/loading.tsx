import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Skeleton, VehicleGridSkeleton } from '@/components/ui/Skeleton';

export default function SearchLoading() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="space-y-5">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
            <VehicleGridSkeleton count={8} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
