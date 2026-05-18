import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { SearchBar } from '@/components/search/SearchBar';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Badge } from '@/components/ui/Badge';
import { getHomepageData, getVehicleTypes, getPopularSearches } from '@/lib/db/queries';
import { formatLKR } from '@/lib/utils';

export const revalidate = 60;

export default async function HomePage() {
  const [{ latest, boosted, promo }, vehicleTypes, popularSearches] = await Promise.all([
    getHomepageData(),
    getVehicleTypes(),
    getPopularSearches(6),
  ]);

  const promoActive =
    promo?.active === true && (promo?.current_count ?? 0) < (promo?.max_count ?? 100);

  const latestVehicles = (latest ?? []).map((row: any) => {
    const images = (row.vehicle_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
    return {
      id: row.id,
      slug: row.slug,
      make_name: row.vehicle_makes?.name ?? '',
      model: row.model,
      year: row.year,
      price: row.price,
      mileage_km: row.mileage_km,
      fuel_type: row.fuel_type,
      transmission: null,
      district_name: row.districts?.name_en ?? '',
      city_name: row.cities?.name_en ?? null,
      condition: 'registered',
      primary_image: images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null,
      is_boosted: false,
      boost_type: null,
      price_dropped: false,
      created_at: row.created_at,
      view_count: row.view_count ?? 0,
    };
  });

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-[var(--brand-deep)] to-[var(--brand-green)] py-12 text-white md:py-20">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            {promoActive && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white">
                🎉 {promo?.label_en ?? 'First 100 sellers — free posting!'}
              </div>
            )}
            <h1 className="mb-3 text-3xl font-bold leading-tight md:text-5xl">
              Find your next vehicle in Sri Lanka
            </h1>
            <p className="mb-8 text-base text-white/80 md:text-lg">
              Thousands of registered vehicles from trusted sellers island-wide.
            </p>
            <SearchBar
              size="large"
              className="mx-auto max-w-xl"
              placeholder="Toyota Aqua, Honda Civic, Colombo..."
            />
            {popularSearches.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {popularSearches.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="rounded-full bg-white/20 px-3 py-1 text-xs capitalize text-white transition-colors hover:bg-white/30"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Vehicle type icons */}
        <section className="border-b border-[var(--color-border)] py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {vehicleTypes.map((type) => (
                <Link
                  key={type.id}
                  href={`/search?vehicleTypeId=${type.id}`}
                  className="group flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors hover:bg-[var(--brand-bg)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-bg)] transition-colors group-hover:bg-[var(--brand-green)]">
                    <span className="text-lg">🚗</span>
                  </div>
                  <span className="text-xs leading-tight text-gray-600 group-hover:text-[var(--brand-green)]">
                    {type.name_en.split('/')[0].trim()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* BoostPro carousel */}
        {boosted.length > 0 && (
          <section className="bg-[var(--brand-bg)] py-8">
            <div className="container mx-auto px-4">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
                <span className="text-amber-500">⚡</span> Featured Listings
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                {(boosted as any[]).slice(0, 6).map((vehicle) => {
                  const images = (vehicle.vehicle_images ?? []).sort(
                    (a: any, b: any) => a.sort_order - b.sort_order,
                  );
                  const img = images[0]?.url;
                  return (
                    <Link
                      key={vehicle.id}
                      href={`/vehicle/${vehicle.slug}`}
                      className="group overflow-hidden rounded-xl border border-amber-200 bg-white transition-all hover:border-amber-400"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {img && (
                          <Image
                            src={img}
                            alt={vehicle.model}
                            fill
                            loading="eager"
                            sizes="200px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute left-1.5 top-1.5">
                          <Badge variant="pro">⚡ Pro</Badge>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-semibold">
                          {vehicle.year} {vehicle.vehicle_makes?.name} {vehicle.model}
                        </p>
                        <p className="text-xs font-bold text-[var(--brand-deep)]">
                          {formatLKR(vehicle.price)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Latest listings */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Latest Vehicles</h2>
              <Link
                href="/search"
                className="flex items-center gap-1 text-sm text-[var(--brand-green)] hover:underline"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {latestVehicles.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <p className="mb-2 text-lg">No vehicles listed yet</p>
                <Link href="/post-ad" className="text-sm text-[var(--brand-green)] hover:underline">
                  Be the first to post an ad →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6">
                {latestVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
