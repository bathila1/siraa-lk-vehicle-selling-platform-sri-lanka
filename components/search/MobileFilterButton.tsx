'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X, Loader2 } from 'lucide-react';

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

/**
 * Mobile filter drawer with live result count.
 *
 * Workflow:
 *   1. User taps "Filters" → drawer slides up from bottom
 *   2. As they change filters, the "Show X results" button updates live
 *   3. User taps "Show X results" → drawer closes, URL navigates
 *
 * This matches the pattern from real estate apps where users want to know
 * "is this filter going to give me 2 results or 200?" before committing.
 */
export function MobileFilterButton({ vehicleTypes, makes, districts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // Count active filters for the trigger button badge
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

  // Body scroll lock + Escape handling
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Live count whenever filters change inside the drawer
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setCountLoading(true);

    const fetchCount = async () => {
      try {
        const params = new URLSearchParams(searchParams.toString());
        params.set('countOnly', '1');
        const res = await fetch(`/api/search/count?${params.toString()}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error('count failed');
        const data = await res.json();
        setPreviewCount(data.count ?? 0);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Fallback: don't show count if endpoint errors
          setPreviewCount(null);
        }
      } finally {
        setCountLoading(false);
      }
    };

    // Small debounce so rapid filter changes don't spam
    const t = setTimeout(fetchCount, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [open, searchParams]);

  const handleClose = () => {
    setOpen(false);
    setPreviewCount(null);
  };

  return (
    <>
      {/* Trigger — mobile only */}
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

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Sheet */}
          <div
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl"
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            {/* Sticky header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeCount > 0 && (
                  <span className="text-xs text-gray-500">({activeCount} active)</span>
                )}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <span className="h-1 w-12 rounded-full bg-gray-200" />
            </div>

            {/* Scrollable filter body */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <FilterBar vehicleTypes={vehicleTypes} makes={makes} districts={districts} />
            </div>

            {/* Sticky bottom — apply with live count */}
            <div
              className="border-t border-[var(--color-border)] bg-white p-3"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-green)] py-3 text-sm font-medium text-white hover:bg-[var(--brand-deep)] disabled:opacity-70"
                disabled={countLoading}
              >
                {countLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking results...
                  </>
                ) : previewCount === 0 ? (
                  <>No vehicles| filters අඩු කරන්න</>
                ) : previewCount !== null ? (
                  <>
                    Show {previewCount.toLocaleString()}{' '}
                    {previewCount === 1 ? 'result' : 'results'}
                  </>
                ) : (
                  <>Show Results</>
                )}
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
