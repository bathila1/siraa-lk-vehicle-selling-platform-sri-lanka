import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Car as CarIcon,
  Bike,
  Truck,
  Bus,
  Tractor,
  Construction,
  MoreHorizontal,
  Caravan,
  Search as SearchIcon,
  ShieldCheck,
  Zap as ZapIcon,
  MessageCircle as MsgIcon,
  BellIcon,
  Bird,
  Locate,
} from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { SearchBar } from '@/components/search/SearchBar';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { Badge } from '@/components/ui/Badge';
import { getHomepageData, getVehicleTypes, getPopularSearches } from '@/lib/db/queries';
import { formatLKR } from '@/lib/utils';
import ComingSoonPopup from '@/components/UnderConstructionBanner';
import { YouTubeLazy } from '@/components/shared/YouTubeLazy';
import { RecentSearches } from '@/components/search/RecentSearches';
import WhatsAppButton from '@/components/shared/WhatsAppButton';

export const revalidate = 60;

// Map vehicle type slug → lucide icon
const TYPE_ICONS: Record<string, any> = {
  car: CarIcon,
  'suv-jeep': CarIcon,
  van: Caravan,
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
      <ComingSoonPopup />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-green)] to-[var(--brand-mint)] text-white">
          <div
            aria-hidden
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Sri Lanka silhouette watermark */}
          <img
            src="/sri-lanka.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 hidden h-64 w-auto -translate-y-1/2 select-none opacity-100 sm:block md:right-16 md:h-96"
          />
          <div className="container relative mx-auto max-w-2xl px-4 py-10 text-center md:py-16">
            {promoActive && (
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm md:text-sm">
                🎉{' '}
                {(promo as any)?.label_en ??
                  'පළමු වාහන පළ කිරීම් 100 නොමිලේ. ඔබත් දැන්ම නොමිලේ දැන්වීම් පළ කිරීමේ අවස්තාවක් ලබා ගන්න. Post Free ක්ලික් කරන්න!'}
              </div>
            )}
            <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl">
              ලියාපදිංචි කළ - Registered වාහන පමණි.
            </h1>
            <p className="mx-auto mb-7 max-w-lg text-sm text-white/85 md:text-lg">
              ශ්‍රී ලංකාවේ වාහන වෙළඳපොළේ නව අත්දැකීමක්. ඔබේ වාහනය විකිණීමට හෝ නව වාහනයක් සොයා ගැනීමට
              අදම 'සිරා' සමඟ සම්බන්ධ වන්න!
            </p>
            <SearchBar
              size="large"
              className="mx-auto max-w-xl shadow-xl"
              placeholder="Toyota Aqua, Honda Civic, Colombo..."
            />
            <div className="mt-4 text-xs text-white/75">
              <section className="container mx-auto px-4 pb-4">
                <RecentSearches />
              </section>
            </div>

            {popularSearches.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {popularSearches.map((s) => (
                  <Link
                    key={s}
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs capitalize text-white transition-colors hover:bg-white/25"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Vehicle type icons strip */}
        <section className="border-b border-[var(--color-border)] bg-white py-6 md:py-8">
          <div className="container mx-auto px-4">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-10 md:overflow-visible md:px-0 md:pb-0">
              {vehicleTypes.map((type: any) => {
                const Icon = TYPE_ICONS[type.slug] ?? MoreHorizontal;
                return (
                  <Link
                    key={type.id}
                    href={`/search?vehicleTypeId=${type.id}`}
                    className="group flex min-w-[68px] flex-shrink-0 flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors hover:bg-[var(--brand-bg)] md:min-w-0"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-bg)] transition-colors group-hover:bg-[var(--brand-green)]">
                      <Icon className="h-5 w-5 text-[var(--brand-deep)] transition-colors group-hover:text-white" />
                    </div>
                    <span className="text-[11px] font-medium leading-tight text-gray-600 group-hover:text-[var(--brand-green)] md:text-xs">
                      {type.name_en.split('/')[0].trim()}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Intro video — lazy loaded */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="mb-5 text-center">
              <h2 className="text-lg font-bold text-[var(--brand-deep)] md:text-xl">
                How Siraa works
              </h2>
              <p className="mt-1 text-sm text-gray-500">A quick 60-second tour of the platform.</p>
            </div>
            <YouTubeLazy videoId="Zk7tfpGezqY" title="How Siraa works" />
          </div>
        </section>

        {/* BoostPro carousel */}
        {boosted.length > 0 && (
          <section className="bg-gradient-to-b from-amber-50/40 to-transparent py-8">
            <div className="container mx-auto px-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold md:text-lg">
                  <ZapIcon className="h-5 w-5 fill-amber-200 text-amber-500" /> Featured
                </h2>
                <Link
                  href="/search?sort=newest"
                  className="text-xs text-gray-500 hover:text-[var(--brand-green)]"
                >
                  More →
                </Link>
              </div>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6">
                {(boosted as any[]).slice(0, 6).map((vehicle) => {
                  const images = (vehicle.vehicle_images ?? []).sort(
                    (a: any, b: any) => a.sort_order - b.sort_order,
                  );
                  const img = images[0]?.url;
                  return (
                    <Link
                      key={vehicle.id}
                      href={`/vehicle/${vehicle.slug}`}
                      className="group w-40 flex-shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-white transition-all hover:border-amber-400 hover:shadow-md md:w-auto"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {img && (
                          <Image
                            src={img}
                            alt={vehicle.model}
                            fill
                            sizes="(max-width: 768px) 160px, 200px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute left-1.5 top-1.5">
                          <Badge variant="pro">Pro⚡</Badge>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-semibold">
                          {vehicle.year} {vehicle.vehicle_makes?.name} {vehicle.model}
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-[var(--brand-deep)]">
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
              <h2 className="text-lg font-bold md:text-xl">අලුත්ම දැන්වීම්</h2>
              <Link
                href="/search?sort=newest"
                className="flex items-center gap-1 text-sm font-medium text-[var(--brand-green)] hover:text-[var(--brand-deep)]"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {latestVehicles.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <div className="mb-4 text-5xl opacity-30">🚗</div>
                <p className="mb-2 text-lg text-gray-500">No vehicles listed yet</p>
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

        {/* Trust strip */}
        <section className="bg-[var(--brand-bg)] py-10">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="mb-6 text-center text-lg font-bold text-[var(--brand-deep)] md:text-xl">
              ඇයි ඔබ සිරා.lk තේරිය යුත්තේ?
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-6">
              {[
                {
                  icon: Bird,
                  title: 'භාවිතය හරිම පහසුයි',
                  desc: 'අපගේ පරිශීලක interface එක සරල සහ නවීනයි, ඔබට අවශ්‍ය වාහනය හෝ විකිණීමට අවශ්‍ය වාහනය ඉක්මනින් සොයා ගැනීමට හැකි වේ.',
                },
                {
                  icon: ShieldCheck,
                  title: 'මහා පරිමාණ Sale shops නොමැත.',
                  desc: 'Registered vehicles පමණක් නිසා Open Papers / Unregistered / Brand New වාහන තිබෙන Sale කරුවන් ඇතුලත් නොවේ. අපි මහා පරිමාණ Sale shops වලට විකුණුම්කරුවන් හෝ මිලදී ගැනීමේ අවස්ථා ලබා නොදෙමු. ඔබට සෘජුවම විකුණුම්කරුවන් හා සම්බන්ධ වීමට හැකි වේ, එමඟින් අමතර ගාස්තු සහ මැදිහත්කාරීත්වය අවම කරයි.',
                },
                {
                  icon: Locate,
                  title: '100% Sri Lankan Website',
                  desc: 'වෙනත් වෙබ් භාවිතයෙන් විදේශ සන්තක වන මුදල් ඉතුරු කරමු. අපි සිරා.lk හි සියලුම දත්ත ශ්‍රී ලංකාවේම සත්කාරකයන් මගින් පවත්වයි.',
                },
                {
                  icon: SearchIcon,
                  title: 'Search කිරීම ඉතාම පහසුයි',
                  desc: '"Toyota Aqua 2015 under 5m Colombo" — just works.',
                },
                {
                  icon: MsgIcon,
                  title: 'WhatsApp & call',
                  desc: 'කෙලින්ම වාහන විකුණුම්කරුවා Contact කරගන්න.  බ්‍රෝකර් කරුවන් නොමැත.',
                },
                {
                  icon: BellIcon,
                  title: ' Price Drop Alerts',
                  desc: 'විකුණුම්කරුවා මිල අඩු කළ විට දැනගන්න.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-[var(--color-border)] bg-white p-5 text-center"
                  >
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-mint)]">
                      <Icon className="h-5 w-5 text-[var(--brand-deep)]" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold">{item.title}</h3>
                    <p className="text-xs leading-relaxed text-gray-500">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 text-center">
          <div className="container mx-auto max-w-md px-4">
            <h2 className="mb-2 text-2xl font-bold text-[var(--brand-deep)]">
              Selling your vehicle?
            </h2>
            <p className="mb-5 text-sm text-gray-500">වාහනයක් ඉක්මනින් විකිණීමට අවශ්‍යද?</p>
            <Link
              href="/post-ad"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-green)] px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-[var(--brand-deep)]"
            >
              Post Your Ad Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
          <WhatsAppButton />

      <Footer />
    </>
  );
}
