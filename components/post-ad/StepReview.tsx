'use client';

import type { PostAdDraft } from './PostAdWizard';
import { formatLKR } from '@/lib/utils';

interface Props {
  draft: PostAdDraft;
  vehicleTypes: { id: number; name_en: string }[];
  makes: { id: number; name: string }[];
  districts: { id: number; name_en: string }[];
  cities: { id: number; district_id: number; name_en: string }[];
}

export function StepReview({ draft, vehicleTypes, makes, districts, cities }: Props) {
  const type = vehicleTypes.find((t) => t.id === draft.vehicleTypeId)?.name_en ?? '—';
  const make = makes.find((m) => m.id === draft.makeId)?.name ?? '—';
  const district = districts.find((d) => d.id === draft.districtId)?.name_en ?? '—';
  const city = cities.find((c) => c.id === draft.cityId)?.name_en;
  const location = city ? `${city}, ${district}` : district;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-base">Review & Publish</h2>
        <p className="text-xs text-gray-500 mt-1">
          Check the details below. You can edit your ad later from the dashboard.
        </p>
      </div>

      {/* Cover image */}
      {draft.imageUrls[0] && (
        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 max-w-sm mx-auto">
          <img src={draft.imageUrls[0]} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title + price */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-[var(--brand-deep)]">
          {draft.year} {make} {draft.model}
        </h3>
        <p className="text-xl font-bold text-[var(--brand-green)] mt-1">
          {draft.price ? formatLKR(draft.price) : '—'}
        </p>
        <p className="text-xs text-gray-500 mt-1">{location}</p>
      </div>

      {/* Specs grid */}
      <div className="bg-[var(--brand-bg)] rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <Row label="Type" value={type} />
        {draft.mileageKm != null && (
          <Row label="Mileage" value={`${draft.mileageKm.toLocaleString()} km`} />
        )}
        {draft.engineCc && <Row label="Engine" value={`${draft.engineCc} cc`} />}
        {draft.transmission && <Row label="Transmission" value={draft.transmission} />}
        {draft.fuelType && <Row label="Fuel" value={draft.fuelType} />}
        {draft.bodyType && <Row label="Body" value={draft.bodyType} />}
        {draft.color && <Row label="Color" value={draft.color} />}
        {draft.previousOwners != null && (
          <Row label="Owners" value={draft.previousOwners === 0 ? 'First owner' : `${draft.previousOwners} prev.`} />
        )}
      </div>

      {/* Description */}
      {draft.description && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{draft.description}</p>
        </div>
      )}

      {/* Photos */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">
          Photos ({draft.imageUrls.length})
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {draft.imageUrls.map((url, i) => (
            <div key={url} className="aspect-square rounded overflow-hidden bg-gray-100">
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center pt-2 border-t border-[var(--color-border)]">
        Tap "Publish Ad" to make your listing live. It will appear in search and on the homepage immediately.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-gray-500">{label}: </span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
