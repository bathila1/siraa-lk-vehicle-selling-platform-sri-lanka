import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Skeleton, VehicleDetailSkeleton } from '@/components/ui/Skeleton';

export default function VehicleLoading() {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-6">
        <Skeleton className="mb-4 h-3 w-48" />
        <VehicleDetailSkeleton />
      </main>
      <Footer />
    </>
  );
}
