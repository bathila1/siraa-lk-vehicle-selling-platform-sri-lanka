import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Gauge, Fuel, Calendar, Users, Settings2, ChevronRight } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Badge } from '@/components/ui/Badge';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { ContactButtons } from '@/components/vehicle/ContactButtons';
import { ImageGallery } from '@/components/vehicle/ImageGallery';
import { LocationMap } from '@/components/vehicle/LocationMap';
import { getVehicleBySlug, getSimilarVehicles } from '@/lib/db/queries';
import { formatLKR, timeAgo, buildVehicleSlug } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: 'Vehicle not found' };

  const title = `${vehicle.year} ${vehicle.make?.name} ${vehicle.model} — ${vehicle.district?.name_en}`;
  const description = vehicle.description?.slice(0, 160) ??
    `${vehicle.year} ${vehicle.make?.name} ${vehicle.model} for sale in ${vehicle.district?.name_en}. Price: ${formatLKR(vehicle.price)}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: vehicle.images[0] ? [{ url: vehicle.images[0].url }] : [],
    },
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const similar = vehicle.vehicle_type && vehicle.make
    ? await getSimilarVehicles(vehicle.id, vehicle.vehicle_type.id, vehicle.make.id)
    : [];

  // Shape similar for VehicleCard
  const similarVehicles = (similar as any[]).map((row) => {
    const images = (row.vehicle_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
    return {
      id: row.id,
      slug: row.slug,
      make_name: row.vehicle_makes?.name ?? '',
      model: row.model,
      year: row.year,
      price: row.price,
      mileage_km: null,
      fuel_type: null,
      transmission: null,
      district_name: row.districts?.name_en ?? '',
      city_name: null,
      condition: 'registered',
      primary_image: images[0]?.url ?? null,
      is_boosted: false,
      boost_type: null,
      price_dropped: false,
      created_at: row.created_at ?? new Date().toISOString(),
      view_count: 0,
    };
  });

  const priceDrop = vehicle.price_history[0];

  // JSON-LD structured data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: `${vehicle.year} ${vehicle.make?.name} ${vehicle.model}`,
    vehicleModelDate: vehicle.year.toString(),
    mileageFromOdometer: vehicle.mileage_km
      ? { '@type': 'QuantitativeValue', value: vehicle.mileage_km, unitCode: 'KMT' }
      : undefined,
    fuelType: vehicle.fuel_type ?? undefined,
    vehicleTransmission: vehicle.transmission ?? undefined,
    color: vehicle.color ?? undefined,
    description: vehicle.description ?? undefined,
    image: vehicle.images.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      price: vehicle.price,
      priceCurrency: 'LKR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Person', name: vehicle.seller?.full_name },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[var(--brand-green)]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/search" className="hover:text-[var(--brand-green)]">Vehicles</Link>
          {vehicle.vehicle_type && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/search?vehicleTypeId=${vehicle.vehicle_type.id}`} className="hover:text-[var(--brand-green)]">
                {vehicle.vehicle_type.name_en}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 truncate max-w-[200px]">
            {vehicle.year} {vehicle.make?.name} {vehicle.model}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: images + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <ImageGallery images={vehicle.images} title={`${vehicle.year} ${vehicle.make?.name} ${vehicle.model}`} />

            {/* Title + price */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-[var(--brand-black)]">
                    {vehicle.year} {vehicle.make?.name} {vehicle.model}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {[vehicle.city?.name_en, vehicle.district?.name_en].filter(Boolean).join(', ')}
                    <span>·</span>
                    <span>{timeAgo(vehicle.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--brand-deep)]">
                    {formatLKR(vehicle.price)}
                  </p>
                  {priceDrop && priceDrop.old_price > priceDrop.new_price && (
                    <p className="text-xs text-red-500 flex items-center gap-1 justify-end mt-1">
                      <Badge variant="price-drop">↓ Price Drop</Badge>
                      <span className="line-through text-gray-400">{formatLKR(priceDrop.old_price)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {vehicle.boost_type === 'pro' && <Badge variant="pro">⚡ Pro</Badge>}
                {vehicle.boost_type === 'normal' && <Badge variant="boost">↑ Boosted</Badge>}
              </div>
            </div>

            {/* Key specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Calendar, label: 'Year', value: vehicle.year },
                vehicle.mileage_km != null && { icon: Gauge, label: 'Mileage', value: `${vehicle.mileage_km.toLocaleString()} km` },
                vehicle.fuel_type && { icon: Fuel, label: 'Fuel', value: vehicle.fuel_type.charAt(0).toUpperCase() + vehicle.fuel_type.slice(1) },
                vehicle.transmission && { icon: Settings2, label: 'Transmission', value: vehicle.transmission.charAt(0).toUpperCase() + vehicle.transmission.slice(1) },
                vehicle.engine_cc && { icon: Settings2, label: 'Engine', value: `${vehicle.engine_cc} cc` },
                vehicle.previous_owners != null && { icon: Users, label: 'Owners', value: vehicle.previous_owners === 0 ? 'First owner' : `${vehicle.previous_owners} prev.` },
              ].filter(Boolean).map((spec: any) => (
                <div key={spec.label} className="bg-[var(--brand-bg)] rounded-lg p-3 flex items-center gap-2">
                  <spec.icon className="w-4 h-4 text-[var(--brand-green)] flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{spec.label}</p>
                    <p className="text-sm font-medium">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {vehicle.description && (
              <div>
                <h2 className="font-semibold mb-2 text-sm text-gray-500 uppercase tracking-wide">Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Custom attributes */}
            {Object.keys(vehicle.custom_attributes).length > 0 && (
              <div>
                <h2 className="font-semibold mb-2 text-sm text-gray-500 uppercase tracking-wide">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(vehicle.custom_attributes).map(([key, val]) => {
                    if (!val || val === false) return null;
                    return (
                      <span key={key} className="text-xs bg-[var(--brand-bg)] px-3 py-1 rounded-full text-gray-700 capitalize">
                        {String(val) === 'true' ? key.replace(/_/g, ' ') : `${key.replace(/_/g, ' ')}: ${val}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map — Leaflet, no Google Maps */}
            {vehicle.lat && vehicle.lng && (
              <div>
                <h2 className="font-semibold mb-2 text-sm text-gray-500 uppercase tracking-wide">Location</h2>
                <LocationMap lat={vehicle.lat} lng={vehicle.lng} label={vehicle.district?.name_en ?? ''} />
              </div>
            )}
          </div>

          {/* Right: contact card (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <ContactButtons
                phone={vehicle.seller?.phone ?? ''}
                whatsapp={vehicle.seller?.whatsapp_number ?? vehicle.seller?.phone ?? ''}
                vehicleId={vehicle.id}
                vehicleTitle={`${vehicle.year} ${vehicle.make?.name} ${vehicle.model}`}
                price={vehicle.price}
              />

              {/* Seller card */}
              {vehicle.seller && (
                <div className="border border-[var(--color-border)] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Seller</p>
                  <p className="font-medium">{vehicle.seller.full_name}</p>
                  <p className="text-sm text-gray-500">{vehicle.seller.district?.name_en}</p>
                  <Link
                    href={`/seller/${vehicle.seller.id}`}
                    className="text-xs text-[var(--brand-green)] hover:underline mt-2 inline-block"
                  >
                    View all ads from this seller →
                  </Link>
                </div>
              )}

              {/* Report */}
              <Link
                href={`/report/${vehicle.id}`}
                className="block text-xs text-gray-400 hover:text-red-500 text-center transition-colors"
              >
                Report this ad
              </Link>
            </div>
          </div>
        </div>

        {/* Similar vehicles */}
        {similarVehicles.length > 0 && (
          <section className="mt-12">
            <h2 className="font-bold text-lg mb-4">Similar Vehicles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {similarVehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
