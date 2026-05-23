import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import {
  getAllDistrictsWithCounts,
  slugifyLocation,
} from '@/lib/db/seo-queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Browse Vehicles by Location in Sri Lanka',
  description: 'Find vehicles for sale by district — Colombo, Kandy, Galle, and more. All Sri Lankan districts covered.',
  alternates: { canonical: '/locations' },
};

export default async function LocationsPage() {
  const districts = await getAllDistrictsWithCounts();
  const activeDistricts = districts.filter((d) => d.count > 0);
  const emptyDistricts = districts.filter((d) => d.count === 0);

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-[var(--brand-deep)] md:text-3xl">
          Browse Vehicles by Location
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          Find verified vehicles for sale across all districts in Sri Lanka.
        </p>

        {activeDistricts.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Districts with listings
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {activeDistricts.map((d) => (
                <Link
                  key={d.id}
                  href={`/locations/${slugifyLocation(d.name_en)}`}
                  className="group flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 transition-all hover:border-[var(--brand-green)]"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--brand-green)]" />
                    <span className="font-medium group-hover:text-[var(--brand-green)]">
                      {d.name_en}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{d.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {emptyDistricts.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              No listings yet
            </h2>
            <div className="flex flex-wrap gap-2">
              {emptyDistricts.map((d) => (
                <span
                  key={d.id}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-gray-400"
                >
                  {d.name_en}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
