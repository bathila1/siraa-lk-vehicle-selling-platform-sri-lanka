import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { getVehicleTypesWithCounts } from '@/lib/db/seo-queries';

export const revalidate = 3600; // 1h cache

export const metadata: Metadata = {
  title: 'Browse Vehicles by Category',
  description: 'Browse all vehicle categories — cars, SUVs, vans, motorcycles, lorries and more for sale in Sri Lanka.',
  alternates: { canonical: '/categories' },
};

export default async function CategoriesPage() {
  const types = await getVehicleTypesWithCounts();

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-[var(--brand-deep)] md:text-3xl">
          Browse by Category
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          Find vehicles by type — all registered vehicles, verified sellers across Sri Lanka.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <Link
              key={t.id}
              href={`/cars/${t.slug}`}
              className="group flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-4 transition-all hover:border-[var(--brand-green)] hover:shadow-md"
            >
              <div>
                <h2 className="font-semibold text-[var(--brand-black)] group-hover:text-[var(--brand-green)]">
                  {t.name_en}
                </h2>
                {t.name_si && (
                  <p className="text-xs text-gray-400 lang-si">{t.name_si}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {t.count.toLocaleString()} {t.count === 1 ? 'listing' : 'listings'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[var(--brand-green)]" />
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
