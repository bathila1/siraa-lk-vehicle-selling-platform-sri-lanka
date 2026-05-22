'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { formatLKR } from '@/lib/utils';

interface FilterOption {
  id: number | string;
  label: string;
}

interface FilterBarProps {
  vehicleTypes: FilterOption[];
  makes: FilterOption[];
  districts: FilterOption[];
}

export function FilterBar({ vehicleTypes, makes, districts }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = Object.fromEntries(searchParams.entries());

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const clearAll = () => {
    const q = searchParams.get('q');
    startTransition(() => router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname));
  };

  const hasActiveFilters = [
    'vehicleTypeId',
    'makeId',
    'districtId',
    'yearMin',
    'yearMax',
    'priceMin',
    'priceMax',
    'transmission',
    'fuelType',
  ].some((k) => searchParams.has(k));

  return (
    <aside className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </h2>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs text-[var(--brand-green)] hover:underline">
            Clear all
          </button>
        )}
      </div>



      {/* Make */}
      {makes.length > 0 && (
        <FilterSection title="Make">
          <select
            value={current.makeId ?? ''}
            onChange={(e) => setParam('makeId', e.target.value || null)}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
          >
            <option value="">All makes</option>
            {makes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </FilterSection>
      )}

      {/* District */}
      <FilterSection title="District">
        <select
          value={current.districtId ?? ''}
          onChange={(e) => setParam('districtId', e.target.value || null)}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
        >
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Year range */}
      {/* <FilterSection title="Year">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="From"
            value={current.yearMin ?? ''}
            min={1990}
            max={2026}
            onChange={(e) => setParam('yearMin', e.target.value || null)}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="number"
            placeholder="To"
            value={current.yearMax ?? ''}
            min={1990}
            max={2026}
            onChange={(e) => setParam('yearMax', e.target.value || null)}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
      </FilterSection> */}

      {/* Price range */}
      {/* <FilterSection title="Price (LKR)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={current.priceMin ?? ''}
            onChange={(e) => setParam('priceMin', e.target.value || null)}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="number"
            placeholder="Max"
            value={current.priceMax ?? ''}
            onChange={(e) => setParam('priceMax', e.target.value || null)}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
        {(current.priceMin || current.priceMax) && (
          <p className="mt-1 text-xs text-gray-400">
            {current.priceMin ? formatLKR(Number(current.priceMin)) : 'Any'}
            {' – '}
            {current.priceMax ? formatLKR(Number(current.priceMax)) : 'Any'}
          </p>
        )}
      </FilterSection> */}

      {/* Transmission */}
      <FilterSection title="Transmission">
        <div className="flex flex-wrap gap-2">
          {['auto', 'manual', 'tiptronic', 'cvt'].map((t) => (
            <FilterChip
              key={t}
              label={t.charAt(0).toUpperCase() + t.slice(1)}
              active={current.transmission === t}
              onClick={() => setParam('transmission', current.transmission === t ? null : t)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Fuel */}
      <FilterSection title="Fuel Type">
        <div className="flex flex-wrap gap-2">
          {['petrol', 'diesel', 'hybrid', 'electric'].map((f) => (
            <FilterChip
              key={f}
              label={f.charAt(0).toUpperCase() + f.slice(1)}
              active={current.fuelType === f}
              onClick={() => setParam('fuelType', current.fuelType === f ? null : f)}
            />
          ))}
        </div>
      </FilterSection>

            {/* Vehicle type */}
      <FilterSection title="Vehicle Type">
        <div className="flex flex-col gap-1">
          {vehicleTypes.map((t) => (
            <FilterChip
              key={t.id}
              label={t.label}
              active={current.vehicleTypeId === String(t.id)}
              onClick={() =>
                setParam(
                  'vehicleTypeId',
                  current.vehicleTypeId === String(t.id) ? null : String(t.id),
                )
              }
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white'
          : 'border-[var(--color-border)] text-gray-600 hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]'
      }`}
    >
      {label}
    </button>
  );
}
