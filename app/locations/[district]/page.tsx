import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { JsonLd } from '@/components/shared/JsonLd';
import {
  getDistrictBySlug,
  getLandingPageListings,
} from '@/lib/db/seo-queries';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ district: string }>;
}

export const revalidate = 1800;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  const d = await getDistrictBySlug(district);
  if (!d) return { title: 'Not found' };

  return {
    title: `Vehicles for Sale in ${d.name_en}, Sri Lanka`,
    description: `Browse vehicles for sale in ${d.name_en} District. Cars, SUVs, motorcycles, and more from verified local sellers.`,
    alternates: { canonical: `/locations/${district}` },
  };
}

export default async function DistrictPage({ params }: Props) {
  const { district } = await params;
  const d = await getDistrictBySlug(district);
  if (!d) notFound();

  const supabase = createServiceClient();
  const [{ data: cities }, listings, { count: totalListings }] = await Promise.all([
    supabase
      .from('cities')
      .select('id, name_en')
      .eq('district_id', d.id)
      .order('name_en'),
    getLandingPageListings({ districtId: d.id }),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('district_id', d.id)
      .eq('status', 'active'),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Locations', item: `${siteUrl}/locations` },
      { '@type': 'ListItem', position: 3, name: d.name_en, item: `${siteUrl}/locations/${district}` },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumb]} />
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-[var(--brand-green)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/locations" className="hover:text-[var(--brand-green)]">Locations</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-700">{d.name_en}</span>
        </nav>

        <section className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--brand-deep)] md:text-3xl">
            <MapPin className="h-6 w-6 text-[var(--brand-green)]" />
            Vehicles in {d.name_en}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {(totalListings ?? 0).toLocaleString()} active listings in {d.name_en} District.
          </p>
        </section>

        {(cities ?? []).length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Cities in {d.name_en}
            </h2>
            <div className="flex flex-wrap gap-2">
              {(cities as any[]).map((c) => (
                <Link
                  key={c.id}
                  href={`/search?districtId=${d.id}&cityId=${c.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs hover:border-[var(--brand-green)]"
                >
                  {c.name_en}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent listings</h2>
            <Link
              href={`/search?districtId=${d.id}`}
              className="text-sm text-[var(--brand-green)] hover:underline"
            >
              View all →
            </Link>
          </div>

          {listings.length === 0 ? (
            <EmptyState
              icon="📍"
              title={`No vehicles in ${d.name_en} yet`}
              description="Check back soon — or browse nearby districts."
              actionLabel="All locations"
              actionHref="/locations"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 max-w-3xl text-sm leading-relaxed text-gray-600">
          <h2 className="mb-3 text-base font-semibold text-[var(--brand-black)]">
            Buying Vehicles in {d.name_en}
          </h2>
          <p>
            {d.name_en} is one of Sri Lanka&apos;s active vehicle markets. Whether you&apos;re searching for a daily commuter, a family SUV, or a commercial vehicle, our local listings give you direct access to sellers in {d.name_en} District — no agents, no inflated prices, just verified phone numbers and real photos.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
