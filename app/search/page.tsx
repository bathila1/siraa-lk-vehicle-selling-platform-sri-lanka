import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { FilterBar } from '@/components/search/FilterBar';
import { getVehicleTypes, getDistricts, getVehicleMakesByType } from '@/lib/db/queries';
import { searchVehicles } from '@/lib/search/query-builder';
import { searchQuerySchema } from '@/lib/validations/schemas';
import { MobileFilterButton } from '@/components/search/MobileFilterButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchX } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q;
  return {
    title: q ? `"${q}" Search Results` : 'Browse Vehicles',
    description: 'Search registered vehicles for sale in Sri Lanka.',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = await searchParams;

  const parsed = searchQuerySchema.safeParse({
    ...raw,
    page: raw.page ? Number(raw.page) : 1,
    perPage: 24,
    vehicleTypeId: raw.vehicleTypeId ? Number(raw.vehicleTypeId) : undefined,
    makeId: raw.makeId ? Number(raw.makeId) : undefined,
    districtId: raw.districtId ? Number(raw.districtId) : undefined,
    cityId: raw.cityId ? Number(raw.cityId) : undefined,
    yearMin: raw.yearMin ? Number(raw.yearMin) : undefined,
    yearMax: raw.yearMax ? Number(raw.yearMax) : undefined,
    priceMin: raw.priceMin ? Number(raw.priceMin) : undefined,
    priceMax: raw.priceMax ? Number(raw.priceMax) : undefined,
    sort: raw.sort ?? 'newest',
  });

  const filters = parsed.success ? parsed.data : { page: 1, perPage: 24, sort: 'newest' as const };

  const [{ vehicles, total, totalPages }, vehicleTypes, districts, makes] = await Promise.all([
    searchVehicles(filters),
    getVehicleTypes(),
    getDistricts(),
    getVehicleMakesByType(filters.vehicleTypeId),
  ]);

  const typeOptions = vehicleTypes.map((t) => ({ id: t.id, label: t.name_en }));
  const districtOptions = districts.map((d) => ({ id: d.id, label: d.name_en }));
  const makeOptions = makes.map((m) => ({ id: m.id, label: m.name }));

  const currentPage = filters.page ?? 1;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters — hidden on mobile */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <Suspense>
              <FilterBar
                vehicleTypes={typeOptions}
                makes={makeOptions}
                districts={districtOptions}
              />
            </Suspense>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            
            {/* Results header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {total === 0
                  ? 'No results'
                  : `${total.toLocaleString()} vehicle${total === 1 ? '' : 's'}`}
                {raw.q ? (
                  <>
                    {' '}
                    for <strong>&quot;{raw.q}&quot;</strong>
                  </>
                ) : (
                  ''
                )}
              </p>

              <div className="flex items-center gap-2">
                <Suspense>
                  <MobileFilterButton
                    vehicleTypes={typeOptions}
                    makes={makeOptions}
                    districts={districtOptions}
                  />
                </Suspense>

                <Suspense>
                  <SortSelect current={raw.sort ?? 'newest'} />
                </Suspense>
              </div>
            </div>

            {/* Grid */}
            {vehicles.length === 0 ? (
            <EmptyState
                icon={SearchX}
                title="No vehicles found."
                description="Clear Filters කර නැවත උත්සාහ කරන්න"
                actionLabel="Clear filters"
                actionHref="/search"
                secondaryLabel="Browse All"
                secondaryHref="/search"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
                {vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && <Pagination current={currentPage} total={totalPages} params={raw} />}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ---------- Sub-components ----------

function SortSelect({ current }: { current: string }) {
  'use client';
  // Server-rendered select — JS-free sort via URL params would need a client component.
  // For now, render as a link list or use a server action.
  // Simple approach: render as native select with form action.
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span>Sort:</span>
      <span className="font-medium capitalize text-gray-700">
        {current === 'newest'
          ? 'Newest'
          : current === 'price_asc'
            ? 'Price ↑'
            : current === 'price_desc'
              ? 'Price ↓'
              : current === 'year_desc'
                ? 'Year ↓'
                : 'Newest'}
      </span>
      {/* Full sort selector is in FilterBar client component */}
    </div>
  );
}

function Pagination({
  current,
  total,
  params,
}: {
  current: number;
  total: number;
  params: Record<string, string>;
}) {
  const buildUrl = (p: number) => {
    const q = new URLSearchParams(params);
    q.set('page', String(p));
    return `/search?${q.toString()}`;
  };

  const pages = Array.from({ length: Math.min(total, 7) }, (_, i) => {
    if (total <= 7) return i + 1;
    if (current <= 4) return i + 1;
    if (current >= total - 3) return total - 6 + i;
    return current - 3 + i;
  });

  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      {current > 1 && (
        <Link
          href={buildUrl(current - 1)}
          className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
        >
          ← Prev
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            p === current
              ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white'
              : 'border-[var(--color-border)] hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]'
          }`}
        >
          {p}
        </Link>
      ))}
      {current < total && (
        <Link
          href={buildUrl(current + 1)}
          className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
