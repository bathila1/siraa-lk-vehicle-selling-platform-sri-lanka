import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Car as CarIcon, Bike, Truck, Bus, Tractor, Construction, MoreHorizontal,
  Search as SearchIcon, ShieldCheck, Zap as ZapIcon, MessageCircle as MsgIcon,
} from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { SearchBar } from '@/components/search/SearchBar';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Badge } from '@/components/ui/Badge';
import { getHomepageData, getVehicleTypes, getPopularSearches } from '@/lib/db/queries';
import { formatLKR } from '@/lib/utils';

export const revalidate = 60;

// Map vehicle type slug → lucide icon
const TYPE_ICONS: Record<string, any> = {
  car: CarIcon,
  'suv-jeep': CarIcon,
  van: Truck,
  motorcycle: Bike,
  'three-wheeler': Bike,
  'lorry-truck': Truck,
  bus: Bus,
  tractor: Tractor,
  'heavy-machinery': Construction,
  'bicycle-ebike': Bike,
};

export default async function HomePage() {
  const [{ latest, boosted, promo }, vehicleTypes, popularSearches] = await Promise.all([
    getHomepageData(),
    getVehicleTypes(),
    getPopularSearches(6),
  ]);

  const promoActive =
    (promo as any)?.active === true &&
    ((promo as any)?.current_count ?? 0) < ((promo as any)?.max_count ?? 100);

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
        <section className="relative bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-green)] to-[var(--brand-mint)] text-white overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative container mx-auto px-4 py-10 md:py-16 text-center max-w-2xl">
            {promoActive && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-medium px-4 py-1.5 rounded-full mb-5 border border-white/30">
                🎉 {(promo as any)?.label_en ?? 'First 100 sellers — free posting!'}
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight tracking-tight">
              Find your next vehicle in&nbsp;Sri&nbsp;Lanka
            </h1>
            <p className="text-white/85 mb-7 text-sm md:text-lg max-w-lg mx-auto">
              Thousands of registered vehicles from trusted sellers island-wide.
            </p>
            <SearchBar
              size="large"
              className="max-w-xl mx-auto shadow-xl"
              placeholder="Toyota Aqua, Honda Civic, Colombo..."
            />
            {popularSearches.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-5">
                {popularSearches.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1 rounded-full transition-colors capitalize border border-white/20"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Vehicle type icons strip */}
        <section className="py-6 md:py-8 border-b border-[var(--color-border)] bg-white">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 md:grid md:grid-cols-10 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
              {vehicleTypes.map((type: any) => {
                const Icon = TYPE_ICONS[type.slug] ?? MoreHorizontal;
                return (
                  <Link
                    key={type.id}
                    href={`/search?vehicleTypeId=${type.id}`}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-[var(--brand-bg)] transition-colors group text-center flex-shrink-0 min-w-[68px] md:min-w-0"
                  >
                    <div className="w-11 h-11 bg-[var(--brand-bg)] group-hover:bg-[var(--brand-green)] rounded-2xl flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5 text-[var(--brand-deep)] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[11px] md:text-xs text-gray-600 group-hover:text-[var(--brand-green)] leading-tight font-medium">
                      {type.name_en.split('/')[0].trim()}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* BoostPro carousel */}
        {boosted.length > 0 && (
          <section className="py-8 bg-gradient-to-b from-amber-50/40 to-transparent">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base md:text-lg flex items-center gap-2">
                  <ZapIcon className="w-5 h-5 text-amber-500 fill-amber-200" /> Featured
                </h2>
                <Link href="/search?sort=newest" className="text-xs text-gray-500 hover:text-[var(--brand-green)]">
                  More →
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:mx-0 md:px-0">
                {(boosted as any[]).slice(0, 6).map((vehicle) => {
                  const images = (vehicle.vehicle_images ?? []).sort(
                    (a: any, b: any) => a.sort_order - b.sort_order,
                  );
                  const img = images[0]?.url;
                  return (
                    <Link
                      key={vehicle.id}
                      href={`/vehicle/${vehicle.slug}`}
                      className="flex-shrink-0 w-40 md:w-auto bg-white rounded-xl overflow-hidden border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all group"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {img && (
                          <Image
                            src={img}
                            alt={vehicle.model}
                            fill
                            sizes="(max-width: 768px) 160px, 200px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute top-1.5 left-1.5">
                          <Badge variant="pro">⚡ Pro</Badge>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold truncate">
                          {vehicle.year} {vehicle.vehicle_makes?.name} {vehicle.model}
                        </p>
                        <p className="text-xs text-[var(--brand-deep)] font-bold mt-0.5">
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
              <h2 className="font-bold text-lg md:text-xl">Latest Vehicles</h2>
              <Link
                href="/search?sort=newest"
                className="text-sm text-[var(--brand-green)] hover:text-[var(--brand-deep)] flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {latestVehicles.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4 opacity-30">🚗</div>
                <p className="text-lg mb-2 text-gray-500">No vehicles listed yet</p>
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

        {/* Trust strip */}
        <section className="py-10 bg-[var(--brand-bg)]">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-center font-bold text-lg md:text-xl mb-6 text-[var(--brand-deep)]">
              Why use Siraa?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Verified sellers',
                  desc: 'Every seller signs in with phone OTP. No fake accounts.',
                },
                {
                  icon: SearchIcon,
                  title: 'Smart search',
                  desc: '"Toyota Aqua 2015 under 5m Colombo" — just works.',
                },
                {
                  icon: MsgIcon,
                  title: 'WhatsApp & call',
                  desc: 'Contact sellers directly. No middlemen, no fees.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-white rounded-xl p-5 text-center border border-[var(--color-border)]"
                  >
                    <div className="w-10 h-10 bg-[var(--brand-mint)] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-[var(--brand-deep)]" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 text-center">
          <div className="container mx-auto px-4 max-w-md">
            <h2 className="text-2xl font-bold mb-2 text-[var(--brand-deep)]">
              Selling your vehicle?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Reach thousands of buyers in Sri Lanka in minutes.
            </p>
            <Link
              href="/post-ad"
              className="inline-flex items-center gap-2 bg-[var(--brand-green)] hover:bg-[var(--brand-deep)] text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-md"
            >
              Post Your Ad <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
