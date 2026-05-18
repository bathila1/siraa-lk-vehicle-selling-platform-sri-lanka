import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Gauge, Fuel, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { formatLKR, timeAgo } from '@/lib/utils';
import type { VehicleListItem } from '@/lib/search/query-builder';

interface VehicleCardProps {
  vehicle: VehicleListItem;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const location = [vehicle.city_name, vehicle.district_name].filter(Boolean).join(', ');

  return (
    <Link
      href={`/vehicle/${vehicle.slug}`}
      className="group block overflow-hidden rounded-xl border border-[var(--color-border)] bg-white transition-all duration-200 hover:border-[var(--brand-green)] hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {vehicle.primary_image ? (
          <Image
            src={vehicle.primary_image}
            alt={`${vehicle.make_name} ${vehicle.model} ${vehicle.year}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {vehicle.boost_type === 'pro' && <Badge variant="pro">⚡ Pro</Badge>}
          {vehicle.boost_type === 'normal' && <Badge variant="boost">↑ Boosted</Badge>}
          {vehicle.price_dropped && <Badge variant="price-drop">↓ Price Drop</Badge>}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Title */}
        <h3 className="mb-1 truncate text-sm font-semibold leading-tight text-[var(--brand-black)]">
          {vehicle.year} {vehicle.make_name} {vehicle.model}
        </h3>

        {/* Price */}
        <p className="mb-2 text-base font-bold text-[var(--brand-deep)]">
          {formatLKR(vehicle.price)}
        </p>

        {/* Details row */}
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

        {/* Location + time */}
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
