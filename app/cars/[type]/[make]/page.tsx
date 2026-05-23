import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, TrendingUp, MapPin } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/shared/JsonLd';
import {
  getVehicleTypeBySlug,
  getMakeBySlug,
  getMakeTypeStats,
  getLandingPageListings,
} from '@/lib/db/seo-queries';
import { formatLKR } from '@/lib/utils';

interface Props {
  params: Promise<{ type: string; make: string }>;
}

export const revalidate = 1800;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, make } = await params;
  const vehicleType = await getVehicleTypeBySlug(type);
  if (!vehicleType) return { title: 'Not found' };
  const makeData = await getMakeBySlug(make, vehicleType.id);
  if (!makeData) return { title: 'Not found' };

  return {
    title: `${makeData.name} ${vehicleType.name_en} for Sale in Sri Lanka`,
    description: `Browse ${makeData.name} ${vehicleType.name_en.toLowerCase()} for sale across Sri Lanka. Compare prices, view photos, and contact sellers directly.`,
    alternates: { canonical: `/cars/${type}/${make}` },
  };
}

export default async function TypeMakeLandingPage({ params }: Props) {
  const { type, make } = await params;
  const vehicleType = await getVehicleTypeBySlug(type);
  if (!vehicleType) notFound();
  const makeData = await getMakeBySlug(make, vehicleType.id);
  if (!makeData) notFound();

  const [stats, listings] = await Promise.all([
    getMakeTypeStats(vehicleType.id, makeData.id),
    getLandingPageListings({ typeId: vehicleType.id, makeId: makeData.id }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: vehicleType.name_en, item: `${siteUrl}/cars/${type}` },
      { '@type': 'ListItem', position: 3, name: makeData.name, item: `${siteUrl}/cars/${type}/${make}` },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumb]} />
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-[var(--brand-green)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/cars/${type}`} className="hover:text-[var(--brand-green)]">
            {vehicleType.name_en}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-700">{makeData.name}</span>
        </nav>

        <section className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--brand-deep)] md:text-3xl">
            {makeData.name} {vehicleType.name_en} for Sale in Sri Lanka
          </h1>
          <p className="mt-2 text-sm text-gray-500 md:text-base">
            {stats.total} listings · Find your {makeData.name} from verified sellers.
          </p>
        </section>

        {/* Stats */}
        {stats.total > 0 && (
          <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Listings" value={stats.total.toLocaleString()} />
            <StatCard
              label="Avg Price"
              value={stats.avgPrice ? formatLKR(stats.avgPrice) : '—'}
            />
            <StatCard
              label="From"
              value={stats.minPrice ? formatLKR(stats.minPrice) : '—'}
            />
            <StatCard
              label="Years"
              value={
                stats.yearRange ? `${stats.yearRange.min}–${stats.yearRange.max}` : '—'
              }
            />
          </section>
        )}

        {/* Popular models */}
        {stats.popularModels.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <TrendingUp className="h-4 w-4 text-[var(--brand-green)]" />
              Popular {makeData.name} Models
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.popularModels.map((m) => (
                <Link
                  key={m.model}
                  href={`/search?makeId=${makeData.id}&vehicleTypeId=${vehicleType.id}&q=${encodeURIComponent(m.model)}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm transition-colors hover:border-[var(--brand-green)]"
                >
                  <span className="font-medium group-hover:text-[var(--brand-green)]">
                    {m.model}
                  </span>
                  <span className="text-xs text-gray-400">{m.count}</span>
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              See our{' '}
              <Link
                href={`/price-guide/${makeData.slug}-${(stats.popularModels[0]?.model ?? '').toLowerCase().replace(/\s+/g, '-')}`}
                className="underline hover:text-[var(--brand-green)]"
              >
                price guide for {makeData.name} {stats.popularModels[0]?.model}
              </Link>{' '}
              to see how prices vary by year.
            </p>
          </section>
        )}

        {/* Listings */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">All {makeData.name} {vehicleType.name_en}</h2>
            <Link
              href={`/search?vehicleTypeId=${vehicleType.id}&makeId=${makeData.id}`}
              className="text-sm text-[var(--brand-green)] hover:underline"
            >
              View all →
            </Link>
          </div>

          {listings.length === 0 ? (
            <EmptyState
              icon="🚗"
              title={`No ${makeData.name} ${vehicleType.name_en.toLowerCase()} listed`}
              description="Try browsing other makes or check back soon."
              actionLabel={`Browse all ${vehicleType.name_en}`}
              actionHref={`/cars/${type}`}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </section>

        {/* SEO body */}
        <section className="mt-12 max-w-3xl text-sm leading-relaxed text-gray-600">
          <h2 className="mb-3 text-base font-semibold text-[var(--brand-black)]">
            About {makeData.name} {vehicleType.name_en} in Sri Lanka
          </h2>
          <p className="mb-3">
            {makeData.name} is one of the most popular {vehicleType.name_en.toLowerCase()} brands in Sri Lanka, known for reliability and resale value. Browse our verified listings to compare prices, years, mileage, and features across all districts.
          </p>
          <p>
            Every {makeData.name} {vehicleType.name_en.toLowerCase()} on Siraa.lk comes from a phone-verified seller. Contact directly via call or WhatsApp once you find a match. For broader options, browse all{' '}
            <Link href={`/cars/${type}`} className="underline hover:text-[var(--brand-green)]">
              {vehicleType.name_en.toLowerCase()}
            </Link>{' '}
            or check our{' '}
            <Link href="/categories" className="underline hover:text-[var(--brand-green)]">
              other vehicle categories
            </Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-[var(--brand-deep)] md:text-base">{value}</p>
    </div>
  );
}
