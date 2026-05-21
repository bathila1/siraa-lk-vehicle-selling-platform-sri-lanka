import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Gauge, Fuel, Clock, Zap, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { formatLKR, timeAgo, cn } from '@/lib/utils';
import type { VehicleListItem } from '@/lib/search/query-builder';

interface VehicleCardProps {
  vehicle: VehicleListItem;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const location = [vehicle.city_name, vehicle.district_name].filter(Boolean).join(', ');

  const isPro = vehicle.boost_type === 'pro';
  const isNormal = vehicle.boost_type === 'normal';
  const isBoosted = isPro || isNormal;

  // Pro = full premium treatment; Normal = subtle accent
  if (isPro) {
    return <PremiumProCard vehicle={vehicle} location={location} />;
  }

  return (
    <Link
      href={`/vehicle/${vehicle.slug}`}
      className={cn(
        'group block overflow-hidden rounded-xl border transition-all duration-200',
        isNormal
          ? 'border-amber-200 hover:border-amber-400 hover:shadow-md bg-yellow-100'
          : 'border-[var(--color-border)] hover:border-[var(--brand-green)] hover:shadow-md bg-white',
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {vehicle.primary_image ? (
          <Image
            src={vehicle.primary_image}
            alt={`${vehicle.make_name} ${vehicle.model} ${vehicle.year}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            loading="lazy"
            className="fade-in object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <NoImageFallback />
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isNormal && <Badge variant="boost">Hot⚡</Badge>}
          {vehicle.price_dropped && <Badge variant="price-drop">↓ Price Drop</Badge>}
        </div>
      </div>

      <div className="p-3">
        <h3 className="mb-1 truncate text-sm font-semibold leading-tight text-[var(--brand-black)]">
          {vehicle.year} {vehicle.make_name} {vehicle.model}
        </h3>
        <p className="mb-2 text-base font-bold text-[var(--brand-deep)]">
          {formatLKR(vehicle.price)}
        </p>

        <DetailsRow vehicle={vehicle} />

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {location}
          </span>
          <span className="ml-2 flex flex-shrink-0 items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(vehicle.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Premium card for BoostPro vehicles. Features:
 *  - Gradient border that animates on hover
 *  - Subtle shimmer effect across the card
 *  - Gold "PRO" badge
 *  - Slightly elevated visual hierarchy
 */
function PremiumProCard({
  vehicle,
  location,
}: {
  vehicle: VehicleListItem;
  location: string;
}) {
  return (
    <Link
      href={`/vehicle/${vehicle.slug}`}
      className="group relative block overflow-hidden rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
    >
      {/* Animated gradient border */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 via-orange-300 to-amber-500 opacity-90"
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Inner card (1.5px gap creates the border effect) */}
      <div className="relative m-[1.5px] overflow-hidden rounded-[10px] bg-white">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {vehicle.primary_image ? (
            <Image
              src={vehicle.primary_image}
              alt={`${vehicle.make_name} ${vehicle.model} ${vehicle.year}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              loading="lazy"
              className="fade-in object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <NoImageFallback />
          )}

          {/* Sparkle shimmer overlay on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
          />

          {/* Premium PRO badge */}
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            <Zap className="h-3 w-3 fill-white" />
            Pro
          </div>

          {vehicle.price_dropped && (
            <div className="absolute right-2 top-2">
              <Badge variant="price-drop">↓ Price Drop</Badge>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-b from-white to-amber-50/30 p-3">
          <h3 className="mb-1 flex items-center gap-1 truncate text-sm font-bold leading-tight text-[var(--brand-black)]">
            <Sparkles className="h-3 w-3 flex-shrink-0 text-amber-500" />
            <span className="truncate">
              {vehicle.year} {vehicle.make_name} {vehicle.model}
            </span>
          </h3>
          <p className="mb-2 bg-gradient-to-r from-[var(--brand-deep)] to-[var(--brand-green)] bg-clip-text text-lg font-extrabold text-transparent">
            {formatLKR(vehicle.price)}
          </p>

          <DetailsRow vehicle={vehicle} />

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {location}
            </span>
            <span className="ml-2 flex flex-shrink-0 items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(vehicle.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DetailsRow({ vehicle }: { vehicle: VehicleListItem }) {
  return (
    <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
      {vehicle.mileage_km != null && (
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />
          {vehicle.mileage_km.toLocaleString()} km
        </span>
      )}
      {vehicle.fuel_type && (
        <span className="flex items-center gap-1">
          <Fuel className="h-3 w-3" />
          <span className="capitalize">{vehicle.fuel_type}</span>
        </span>
      )}
      {vehicle.transmission && <span className="capitalize">{vehicle.transmission}</span>}
    </div>
  );
}

function NoImageFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
      <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
      </svg>
    </div>
  );
}
