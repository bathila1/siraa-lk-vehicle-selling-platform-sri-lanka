import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Skeleton, BlogCardSkeleton } from '@/components/ui/Skeleton';

export default function BlogLoading() {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto h-9 w-24" />
          <Skeleton className="mx-auto mt-2 h-4 w-72" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
