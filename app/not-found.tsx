import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-20 text-center max-w-md">
        <p className="text-7xl mb-4 opacity-30 select-none">🔍</p>
        <h1 className="text-3xl font-bold text-[var(--brand-deep)] mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[var(--brand-green)] hover:bg-[var(--brand-deep)] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm text-[var(--brand-green)] hover:underline"
          >
            <Search className="w-4 h-4" />
            Browse Vehicles
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
