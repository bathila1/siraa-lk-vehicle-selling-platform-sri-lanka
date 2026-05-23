import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getVehicleTypeBySlug,
  getMakesForType,
  getLandingPageListings,
} from '@/lib/db/seo-queries';
import { JsonLd } from '@/components/shared/JsonLd';

interface Props {
  params: Promise<{ type: string }>;
}

export const revalidate = 1800; // 30min

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const vehicleType = await getVehicleTypeBySlug(type);
  if (!vehicleType) return { title: 'Not found' };

  const name = vehicleType.name_en;
  return {
    title: `${name} for Sale in Sri Lanka`,
    description: `Browse ${name.toLowerCase()} for sale across Sri Lanka. Verified sellers, transparent prices, all districts.`,
    alternates: { canonical: `/cars/${type}` },
    openGraph: {
      title: `${name} for Sale in Sri Lanka — Siraa.lk`,
      description: `Find your next ${name.toLowerCase()} from trusted sellers across Sri Lanka.`,
    },
  };
}

export default async function TypeLandingPage({ params }: Props) {
  const { type } = await params;
  const vehicleType = await getVehicleTypeBySlug(type);
  if (!vehicleType) notFound();

  const [makes, recentListings] = await Promise.all([
    getMakesForType(vehicleType.id),
    getLandingPageListings({ typeId: vehicleType.id }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';
  const totalListings = makes.reduce((sum, m) => sum + m.count, 0);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${siteUrl}/categories` },
      { '@type': 'ListItem', position: 3, name: vehicleType.name_en, item: `${siteUrl}/cars/${type}` },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumb]} />
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-[var(--brand-green)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/categories" className="hover:text-[var(--brand-green)]">Categories</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-700">{vehicleType.name_en}</span>
        </nav>

        {/* Hero */}
        <section className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--brand-deep)] md:text-3xl">
            {vehicleType.name_en} for Sale in Sri Lanka
          </h1>
          <p className="mt-2 text-sm text-gray-500 md:text-base">
            {totalListings.toLocaleString()} verified {vehicleType.name_en.toLowerCase()} from sellers across Sri Lanka.
          </p>
        </section>

        {/* Browse by make */}
        {makes.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold">Browse by Make</h2>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {makes.map((m) => (
                <Link
                  key={m.id}
                  href={`/cars/${type}/${m.slug}`}
                  className="group flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm transition-colors hover:border-[var(--brand-green)]"
                >
                  <span className="font-medium group-hover:text-[var(--brand-green)]">
                    {m.name}
                  </span>
                  <span className="text-xs text-gray-400">{m.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent listings */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent {vehicleType.name_en}</h2>
            <Link
              href={`/search?vehicleTypeId=${vehicleType.id}`}
              className="text-sm text-[var(--brand-green)] hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentListings.length === 0 ? (
            <EmptyState
              icon="🚗"
              title={`No ${vehicleType.name_en.toLowerCase()} listed yet`}
              description="Check back soon — sellers are posting daily."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recentListings.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </section>

        {/* SEO body content */}
        <section className="mt-12 max-w-3xl text-sm leading-relaxed text-gray-600">
          <h2 className="mb-3 text-base font-semibold text-[var(--brand-black)]">
            Buying {vehicleType.name_en} in Sri Lanka
          </h2>
          <p className="mb-3">
            Siraa.lk is Sri Lanka&apos;s premium marketplace for registered vehicles. All {vehicleType.name_en.toLowerCase()} listed here are from verified sellers with phone-confirmed accounts, helping you avoid scams and find genuine deals.
          </p>
          <p className="mb-3">
            Whether you&apos;re looking for a family vehicle, a commercial workhorse, or your first set of wheels, our search filters help you narrow down by year, district, make, model, and price range. Each listing shows real photos uploaded by the seller, contact options (call or WhatsApp), and the seller&apos;s history on the platform.
          </p>
          <p>
            Browse all {vehicleType.name_en.toLowerCase()} listings or filter by your preferred make above to find the perfect vehicle.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
