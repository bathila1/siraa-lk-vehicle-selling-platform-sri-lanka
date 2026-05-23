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
import { SaveButton } from '@/components/vehicle/SaveButton';
import { JsonLd, vehicleListingSchema, breadcrumbSchema } from '@/components/shared/JsonLd';
import { getVehicleBySlug, getSimilarVehicles } from '@/lib/db/queries';
import { formatLKR, timeAgo, buildVehicleSlug } from '@/lib/utils';
import { QuickContactWidget } from '@/components/vehicle/QuickContactWidget';
import { ShareButtons } from '@/components/shared/ShareButtons';
import { getTrustTier, VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: 'Vehicle not found' };

  const title = `${vehicle.year} ${vehicle.make?.name} ${vehicle.model} — ${vehicle.district?.name_en}`;
  const description =
    vehicle.description?.slice(0, 160) ??
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

  const similar =
    vehicle.vehicle_type && vehicle.make
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';
  const vehicleUrl = `${siteUrl}/vehicle/${vehicle.slug}`;
  const vehicleName = `${vehicle.year} ${vehicle.make?.name} ${vehicle.model}`;

  const vehicleJsonLd = vehicleListingSchema({
    url: vehicleUrl,
    name: vehicleName,
    description: vehicle.description ?? `${vehicleName} for sale in ${vehicle.district?.name_en}`,
    images: vehicle.images.map((i) => i.url),
    brand: vehicle.make?.name ?? '',
    model: vehicle.model,
    year: vehicle.year,
    mileageKm: vehicle.mileage_km,
    fuelType: vehicle.fuel_type,
    transmission: vehicle.transmission,
    bodyType: vehicle.body_type,
    color: vehicle.color,
    price: vehicle.price,
    city: vehicle.city?.name_en ?? null,
    district: vehicle.district?.name_en ?? '',
    sellerName: vehicle.seller?.full_name ?? 'Private Seller',
    available: vehicle.status === 'active',
    datePosted: vehicle.created_at,
  });

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', url: siteUrl },
    { name: 'Vehicles', url: `${siteUrl}/search` },
    ...(vehicle.vehicle_type
      ? [
          {
            name: vehicle.vehicle_type.name_en,
            url: `${siteUrl}/search?vehicleTypeId=${vehicle.vehicle_type.id}`,
          },
        ]
      : []),
    { name: vehicleName, url: vehicleUrl },
  ]);

  return (
    <>
      <JsonLd data={[vehicleJsonLd, breadcrumbJsonLd]} />
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1 text-xs text-gray-500">
          <Link href="/" className="hover:text-[var(--brand-green)]">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/search" className="hover:text-[var(--brand-green)]">
            Vehicles
          </Link>
          {vehicle.vehicle_type && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link
                href={`/search?vehicleTypeId=${vehicle.vehicle_type.id}`}
                className="hover:text-[var(--brand-green)]"
              >
                {vehicle.vehicle_type.name_en}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="max-w-[200px] truncate text-gray-700">
            {vehicle.year} {vehicle.make?.name} {vehicle.model}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: images + details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Image gallery */}
            <ImageGallery
              images={vehicle.images}
              title={`${vehicle.year} ${vehicle.make?.name} ${vehicle.model}`}
            />

            {/* Title + price */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-[var(--brand-black)] md:text-2xl">
                    {vehicle.year} {vehicle.make?.name} {vehicle.model}
                  </h1>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
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
                    <p className="mt-1 flex items-center justify-end gap-1 text-xs text-red-500">
                      <Badge variant="price-drop">↓ Price Drop</Badge>
                      <span className="text-gray-400 line-through">
                        {formatLKR(priceDrop.old_price)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                {vehicle.boost_type === 'pro' && <Badge variant="pro">⚡ Pro</Badge>}
                {vehicle.boost_type === 'normal' && <Badge variant="boost">↑ Boosted</Badge>}
              </div>
            </div>

            {/* Key specs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: Calendar, label: 'Year', value: vehicle.year },
                vehicle.mileage_km != null && {
                  icon: Gauge,
                  label: 'Mileage',
                  value: `${vehicle.mileage_km.toLocaleString()} km`,
                },
                vehicle.fuel_type && {
                  icon: Fuel,
                  label: 'Fuel',
                  value: vehicle.fuel_type.charAt(0).toUpperCase() + vehicle.fuel_type.slice(1),
                },
                vehicle.transmission && {
                  icon: Settings2,
                  label: 'Transmission',
                  value:
                    vehicle.transmission.charAt(0).toUpperCase() + vehicle.transmission.slice(1),
                },
                vehicle.engine_cc && {
                  icon: Settings2,
                  label: 'Engine',
                  value: `${vehicle.engine_cc} cc`,
                },
                vehicle.previous_owners != null && {
                  icon: Users,
                  label: 'Owners',
                  value:
                    vehicle.previous_owners === 0
                      ? 'First owner'
                      : `${vehicle.previous_owners} prev.`,
                },
              ]
                .filter(Boolean)
                .map((spec: any) => (
                  <div
                    key={spec.label}
                    className="flex items-center gap-2 rounded-lg bg-[var(--brand-bg)] p-3"
                  >
                    <spec.icon className="h-4 w-4 flex-shrink-0 text-[var(--brand-green)]" />
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
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Description
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Custom attributes */}
            {Object.keys(vehicle.custom_attributes).length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Features
                </h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(vehicle.custom_attributes).map(([key, val]) => {
                    if (!val || val === false) return null;
                    return (
                      <span
                        key={key}
                        className="rounded-full bg-[var(--brand-bg)] px-3 py-1 text-xs capitalize text-gray-700"
                      >
                        {String(val) === 'true'
                          ? key.replace(/_/g, ' ')
                          : `${key.replace(/_/g, ' ')}: ${val}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map — Leaflet, no Google Maps */}
            {vehicle.lat && vehicle.lng && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Location
                </h2>
                <LocationMap
                  lat={vehicle.lat}
                  lng={vehicle.lng}
                  label={vehicle.district?.name_en ?? ''}
                />
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

              <SaveButton vehicleId={vehicle.id} />

              {/* Seller card */}
              {vehicle.seller && (
                <div className="rounded-xl border border-[var(--color-border)] p-4">
                  <p className="mb-1 text-xs text-gray-500">Seller</p>
                  <p className="font-medium">{vehicle.seller.full_name}</p>
                  <VerifiedBadge tier={getTrustTier(vehicle.seller)} showLabel />
                  <p className="text-sm text-gray-500">{vehicle.seller.district?.name_en}</p>
                  <Link
                    href={`/seller/${vehicle.seller.id}`}
                    className="mt-2 inline-block text-xs text-[var(--brand-green)] hover:underline"
                  >
                    View all ads from this seller →
                  </Link>
                </div>
              )}

              {/* New */}
              <div className="my-4">
                <ShareButtons
                  url={`${process.env.NEXT_PUBLIC_SITE_URL}/vehicle/${vehicle.slug}`}
                  title={`${vehicle.year} ${vehicle.make?.name} ${vehicle.model}`}
                  description={formatLKR(vehicle.price)}
                />
              </div>
              {/* New */}

              {/* Report */}
              <Link
                href={`/report/${vehicle.id}`}
                className="block text-center text-xs text-gray-400 transition-colors hover:text-red-500"
              >
                Report this ad
              </Link>
            </div>
          </div>
        </div>

        {/* Similar vehicles */}
        {similarVehicles.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold">Similar Vehicles</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {similarVehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </section>
        )}
      </main>
      <QuickContactWidget
        phone={vehicle.seller?.phone ?? ''}
        whatsapp={vehicle.seller?.whatsapp_number ?? vehicle.seller?.phone ?? ''}
        vehicleId={vehicle.id}
        vehicleTitle={`${vehicle.year} ${vehicle.make?.name} ${vehicle.model}`}
        price={vehicle.price}
      />
      <Footer />
    </>
  );
}
