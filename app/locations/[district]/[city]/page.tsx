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
  slugifyLocation,
} from '@/lib/db/seo-queries';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ district: string; city: string }>;
}

export const revalidate = 1800;

async function getCityInDistrict(districtId: number, citySlug: string) {
  const supabase = createServiceClient();
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_en, name_si')
    .eq('district_id', districtId);

  if (!cities) return null;
  // Find city whose slugified name matches
  return (
    (cities as any[]).find(
      (c) => slugifyLocation(c.name_en) === citySlug.toLowerCase(),
    ) ?? null
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district, city } = await params;
  const d = await getDistrictBySlug(district);
  if (!d) return { title: 'Not found' };
  const c = await getCityInDistrict(d.id, city);
  if (!c) return { title: 'Not found' };

  return {
    title: `Vehicles for Sale in ${c.name_en}, ${d.name_en}`,
    description: `Browse vehicles for sale in ${c.name_en}, ${d.name_en} District. Cars, SUVs, motorcycles, and more from verified local sellers.`,
    alternates: { canonical: `/locations/${district}/${city}` },
  };
}

export default async function CityPage({ params }: Props) {
  const { district, city } = await params;
  const d = await getDistrictBySlug(district);
  if (!d) notFound();
  const c = await getCityInDistrict(d.id, city);
  if (!c) notFound();

  const supabase = createServiceClient();
  const [listings, { count: totalListings }, { data: nearbyCities }] = await Promise.all([
    getLandingPageListings({ cityId: c.id }),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', c.id)
      .eq('status', 'active'),
    supabase
      .from('cities')
      .select('id, name_en')
      .eq('district_id', d.id)
      .neq('id', c.id)
      .order('name_en')
      .limit(12),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Locations', item: `${siteUrl}/locations` },
      { '@type': 'ListItem', position: 3, name: d.name_en, item: `${siteUrl}/locations/${district}` },
      { '@type': 'ListItem', position: 4, name: c.name_en, item: `${siteUrl}/locations/${district}/${city}` },
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
          <Link href="/locations" className="hover:text-[var(--brand-green)]">Locations</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/locations/${district}`} className="hover:text-[var(--brand-green)]">
            {d.name_en}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-700">{c.name_en}</span>
        </nav>

        <section className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--brand-deep)] md:text-3xl">
            <MapPin className="h-6 w-6 text-[var(--brand-green)]" />
            Vehicles in {c.name_en}
          </h1>
          {c.name_si && (
            <p className="mt-1 text-base text-gray-600 lang-si">{c.name_si}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            {(totalListings ?? 0).toLocaleString()} active listings in {c.name_en},{' '}
            {d.name_en} District.
          </p>
        </section>

        {/* Listings */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent listings</h2>
            <Link
              href={`/search?cityId=${c.id}`}
              className="text-sm text-[var(--brand-green)] hover:underline"
            >
              View all →
            </Link>
          </div>

          {listings.length === 0 ? (
            <EmptyState
              icon="📍"
              title={`No vehicles in ${c.name_en} yet`}
              description={`Try ${d.name_en} District or nearby cities.`}
              actionLabel={`All vehicles in ${d.name_en}`}
              actionHref={`/locations/${district}`}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </section>

        {/* Nearby cities in same district */}
        {(nearbyCities ?? []).length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Other cities in {d.name_en}
            </h2>
            <div className="flex flex-wrap gap-2">
              {(nearbyCities as any[]).map((city) => (
                <Link
                  key={city.id}
                  href={`/locations/${district}/${slugifyLocation(city.name_en)}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
                >
                  {city.name_en}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SEO body */}
        <section className="mt-12 max-w-3xl text-sm leading-relaxed text-gray-600">
          <h2 className="mb-3 text-base font-semibold text-[var(--brand-black)]">
            Buying Vehicles in {c.name_en}
          </h2>
          <p className="mb-3">
            {c.name_en} is part of {d.name_en} District. Browse local listings from
            phone-verified sellers in {c.name_en} and nearby areas. All ads include real photos,
            seller phone numbers, and WhatsApp contact options.
          </p>
          <p>
            For a wider selection, see{' '}
            <Link href={`/locations/${district}`} className="underline hover:text-[var(--brand-green)]">
              all vehicles in {d.name_en}
            </Link>{' '}
            or{' '}
            <Link href="/locations" className="underline hover:text-[var(--brand-green)]">
              browse other districts
            </Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
