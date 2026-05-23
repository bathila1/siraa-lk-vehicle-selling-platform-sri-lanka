import { Header } from '@/components/shared/Header';
import { Skeleton, DashboardRowSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <DashboardRowSkeleton key={i} />
          ))}
        </div>
      </main>
    </>
  );
}
