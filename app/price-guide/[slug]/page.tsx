import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, TrendingUp, Calendar, Gauge } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { JsonLd } from '@/components/shared/JsonLd';
import { getPriceGuide, getLandingPageListings } from '@/lib/db/seo-queries';
import { createServiceClient } from '@/lib/supabase/server';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatLKR } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 21600; // 6h — price data is expensive

/**
 * Resolve "toyota-aqua" → make=Toyota, model=Aqua
 * Splits on first hyphen, tries make slug match.
 */
async function resolveSlug(slug: string) {
  const supabase = createServiceClient();

  // Get all makes once
  const { data: makes } = await supabase
    .from('vehicle_makes')
    .select('id, name, slug')
    .eq('active', true);

  if (!makes) return null;

  const lower = slug.toLowerCase();

  // Find a make whose slug is a prefix of our slug
  for (const make of makes as any[]) {
    const makeSlug = make.slug.toLowerCase();
    if (lower === makeSlug || lower.startsWith(`${makeSlug}-`)) {
      // Model = remaining string with hyphens converted to spaces
      const modelSlug = lower === makeSlug ? '' : lower.slice(makeSlug.length + 1);
      if (!modelSlug) continue;
      const model = modelSlug.replace(/-/g, ' ');
      return { make, model };
    }
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveSlug(slug);
  if (!resolved) return { title: 'Not found' };

  const title = `${resolved.make.name} ${capitalizeWords(resolved.model)}`;
  return {
    title: `${title} Price Guide — Sri Lanka`,
    description: `Real prices for used ${title} in Sri Lanka. See average prices by year and mileage, plus current listings.`,
    alternates: { canonical: `/price-guide/${slug}` },
  };
}

function capitalizeWords(s: string): string {
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function PriceGuidePage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveSlug(slug);
  if (!resolved) notFound();

  const { make, model } = resolved;
  const titleModel = capitalizeWords(model);
  const fullTitle = `${make.name} ${titleModel}`;

  const [stats, listings] = await Promise.all([
    getPriceGuide(make.id, model),
    getLandingPageListings({ makeId: make.id, model }),
  ]);

  if (!stats || stats.total === 0) {
    return (
      <>
        <Header />
        <main className="container mx-auto max-w-3xl px-4 py-8">
          <EmptyState
            icon={TrendingUp}
            title="Not enough data for a price guide yet"
            description={`We need at least a few ${fullTitle} listings to build a guide. Check back soon!`}
            actionLabel="Browse all price guides"
            actionHref="/price-guide"
          />
        </main>
        <Footer />
      </>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Price Guide', item: `${siteUrl}/price-guide` },
      { '@type': 'ListItem', position: 3, name: fullTitle, item: `${siteUrl}/price-guide/${slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumb]} />
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-[var(--brand-green)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/price-guide" className="hover:text-[var(--brand-green)]">Price Guide</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-700">{fullTitle}</span>
        </nav>

        <section className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--brand-deep)] md:text-3xl">
            {fullTitle} Price Guide — Sri Lanka
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Based on {stats.total.toLocaleString()} real listings on Siraa.lk · Average price{' '}
            <span className="font-semibold text-[var(--brand-deep)]">{formatLKR(stats.avgPrice)}</span>
          </p>
        </section>

        {/* By year */}
        {stats.byYear.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Calendar className="h-4 w-4 text-[var(--brand-green)]" />
              Average Price by Year
            </h2>
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Year</th>
                      <th className="px-3 py-2 text-right font-medium">Listings</th>
                      <th className="px-3 py-2 text-right font-medium">Average</th>
                      <th className="px-3 py-2 text-right font-medium">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byYear.map((y) => (
                      <tr key={y.year} className="border-t border-[var(--color-border)]">
                        <td className="px-3 py-2 font-medium">{y.year}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{y.count}</td>
                        <td className="px-3 py-2 text-right font-semibold text-[var(--brand-deep)]">
                          {formatLKR(y.avgPrice)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-gray-500">
                          {formatLKR(y.minPrice)} – {formatLKR(y.maxPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* By mileage */}
        {stats.byMileage.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Gauge className="h-4 w-4 text-[var(--brand-green)]" />
              Average Price by Mileage
            </h2>
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Mileage</th>
                    <th className="px-3 py-2 text-right font-medium">Listings</th>
                    <th className="px-3 py-2 text-right font-medium">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byMileage.map((b) => (
                    <tr key={b.bracket} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2 font-medium">{b.bracket}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{b.count}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--brand-deep)]">
                        {formatLKR(b.avgPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Current listings */}
        {listings.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Current {fullTitle} Listings</h2>
              <Link
                href={`/search?makeId=${make.id}&q=${encodeURIComponent(model)}`}
                className="text-sm text-[var(--brand-green)] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 max-w-3xl text-sm leading-relaxed text-gray-600">
          <h2 className="mb-3 text-base font-semibold text-[var(--brand-black)]">
            How to Use This Guide
          </h2>
          <p className="mb-3">
            Use the average price as a benchmark when comparing listings. If a {fullTitle} is priced significantly below the average for its year and mileage, ask the seller why — there may be a genuine reason (urgent sale, minor damage, high mileage) or it could be a warning sign.
          </p>
          <p className="mb-3">
            Prices in Sri Lanka are affected by import permits, registration status, fuel type, and seller location. Listings from urban centres like Colombo tend to be slightly higher than rural districts.
          </p>
          <p className="text-xs text-gray-400">
            Data updates every 6 hours from active and sold listings on Siraa.lk.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
