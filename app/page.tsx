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
    const images = (row.vehicle_images ?? []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order,
    );
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
      primary_image:
        images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null,
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
        <section className="bg-gradient-to-br from-[var(--brand-deep)] to-[var(--brand-green)] text-white py-12 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            {promoActive && (
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                🎉 {promo?.label_en ?? 'First 100 sellers — free posting!'}
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">
              Find your next vehicle in Sri Lanka
            </h1>
            <p className="text-white/80 mb-8 text-base md:text-lg">
              Thousands of registered vehicles from trusted sellers island-wide.
            </p>
            <SearchBar
              size="large"
              className="max-w-xl mx-auto"
              placeholder="Toyota Aqua, Honda Civic, Colombo..."
            />
            {popularSearches.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {popularSearches.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition-colors capitalize"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Vehicle type icons */}
        <section className="py-8 border-b border-[var(--color-border)]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {vehicleTypes.map((type) => (
                <Link
                  key={type.id}
                  href={`/search?vehicleTypeId=${type.id}`}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-[var(--brand-bg)] transition-colors group text-center"
                >
                  <div className="w-10 h-10 bg-[var(--brand-bg)] group-hover:bg-[var(--brand-green)] rounded-full flex items-center justify-center transition-colors">
                    <span className="text-lg">🚗</span>
                  </div>
                  <span className="text-xs text-gray-600 group-hover:text-[var(--brand-green)] leading-tight">
                    {type.name_en.split('/')[0].trim()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* BoostPro carousel */}
        {boosted.length > 0 && (
          <section className="py-8 bg-[var(--brand-bg)]">
            <div className="container mx-auto px-4">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <span className="text-amber-500">⚡</span> Featured Listings
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {(boosted as any[]).slice(0, 6).map((vehicle) => {
                  const images = (vehicle.vehicle_images ?? []).sort(
                    (a: any, b: any) => a.sort_order - b.sort_order,
                  );
                  const img = images[0]?.url;
                  return (
                    <Link
                      key={vehicle.id}
                      href={`/vehicle/${vehicle.slug}`}
                      className="bg-white rounded-xl overflow-hidden border border-amber-200 hover:border-amber-400 transition-all group"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {img && (
                          <Image
                            src={img}
                            alt={vehicle.model}
                            fill
                            sizes="200px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute top-1.5 left-1.5">
                          <Badge variant="pro">⚡ Pro</Badge>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold truncate">
                          {vehicle.year} {vehicle.vehicle_makes?.name} {vehicle.model}
                        </p>
                        <p className="text-xs text-[var(--brand-deep)] font-bold">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Latest Vehicles</h2>
              <Link
                href="/search"
                className="text-sm text-[var(--brand-green)] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {latestVehicles.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg mb-2">No vehicles listed yet</p>
                <Link
                  href="/post-ad"
                  className="text-[var(--brand-green)] hover:underline text-sm"
                >
                  Be the first to post an ad →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
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
