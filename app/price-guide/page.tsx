import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, ChevronRight } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { getTopMakeModels } from '@/lib/db/seo-queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Used Vehicle Price Guide — Sri Lanka',
  description: 'Sri Lanka vehicle price guides. See average prices, year-by-year trends, and how mileage affects value for popular models.',
  alternates: { canonical: '/price-guide' },
};

export default async function PriceGuideIndexPage() {
  const models = await getTopMakeModels(30);

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--brand-deep)] md:text-3xl">
            <TrendingUp className="h-6 w-6 text-[var(--brand-green)]" />
            Vehicle Price Guide
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Real prices from listings on Siraa.lk — see how vehicle values vary by year, mileage, and condition.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Popular Models
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((m) => {
              const slug = `${m.makeSlug}-${m.model.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <Link
                  key={`${m.makeId}-${m.model}`}
                  href={`/price-guide/${slug}`}
                  className="group flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 transition-all hover:border-[var(--brand-green)]"
                >
                  <div>
                    <p className="font-medium group-hover:text-[var(--brand-green)]">
                      {m.makeName} {m.model}
                    </p>
                    <p className="text-xs text-gray-400">{m.count} listings tracked</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[var(--brand-green)]" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-12 max-w-3xl text-sm leading-relaxed text-gray-600">
          <h2 className="mb-3 text-base font-semibold text-[var(--brand-black)]">
            How Our Price Guides Work
          </h2>
          <p className="mb-3">
            Each guide is built from real listings on Siraa.lk — both active ads and sold vehicles.
            We aggregate prices by year and by mileage bracket so you can spot fair deals, overpriced ads, and hidden bargains.
          </p>
          <p>
            Prices update automatically as new listings appear and old ones sell. This is data from actual Sri Lankan sellers — not theoretical book values from overseas markets.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
