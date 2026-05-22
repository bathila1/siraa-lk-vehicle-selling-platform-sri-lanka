'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';

import { FilterBar } from './FilterBar';

interface FilterOption {
  id: number | string;
  label: string;
}

interface Props {
  vehicleTypes: FilterOption[];
  makes: FilterOption[];
  districts: FilterOption[];
}

export function MobileFilterButton({ vehicleTypes, makes, districts }: Props) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  // Count active filters for the badge
  const activeCount = [
    'vehicleTypeId',
    'makeId',
    'districtId',
    'yearMin',
    'yearMax',
    'priceMin',
    'priceMax',
    'transmission',
    'fuelType',
  ].filter((k) => searchParams.has(k)).length;

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Trigger button — shown on mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium hover:border-[var(--brand-green)] lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-green)] px-1.5 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop + drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Slide-up sheet */}
          <div
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl"
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            {/* Header — sticky */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeCount > 0 && (
                  <span className="text-xs text-gray-500">({activeCount} active)</span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drag handle (visual only) */}
            <div className="flex justify-center py-2">
              <span className="h-1 w-12 rounded-full bg-gray-200" />
            </div>

            {/* Filter content */}
            <div className="px-4 pb-24">
              <FilterBar
                vehicleTypes={vehicleTypes}
                makes={makes}
                districts={districts}
              />
            </div>

            {/* Apply button — sticky bottom */}
            <div className="sticky bottom-0 border-t border-[var(--color-border)] bg-white p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-lg bg-[var(--brand-green)] py-3 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
              >
                Show Results
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}