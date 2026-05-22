'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Edit3, CheckSquare, Trash2, Zap } from 'lucide-react';

interface Props {
  isBoosted: boolean;
  vehicleId: number;
  vehicleSlug: string;
  isSold: boolean;
}

export function DashboardActions({isBoosted, vehicleId, isSold }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // console.log('DashboardActions rendered with:', { isBoosted, vehicleId, isSold });

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markSold = async () => {
    if (!confirm('Mark this vehicle as sold?')) return;
    setBusy(true);
    try {
      await fetch(`/api/vehicles/${vehicleId}/mark-sold`, { method: 'POST' });
      router.refresh();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const deleteAd = async () => {
    if (!confirm('Delete this ad permanently? This cannot be undone.')) return;
    setBusy(true);
    try {
      await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Primary visible actions — only when not sold */}
      {!isSold && (
        <>
        {!isBoosted && (
          // {/* Boost — revenue driver, highest emphasis */}
          <Link
            href={`/dashboard/boost/${vehicleId}`}
            className="flex h-9 items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 text-xs font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-95 sm:px-3 sm:text-sm"
            aria-label="Boost this ad"
          >
            <Zap className="h-3.5 w-3.5 fill-white" />
            <span className="hidden xs:inline">Boost</span>
          </Link>
        )}
          {/* Mark as sold — neutral but visible */}
          <button
            type="button"
            onClick={markSold}
            disabled={busy}
            className="flex h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white px-2.5 text-xs font-medium text-gray-700 transition-colors hover:border-[var(--brand-green)] hover:text-[var(--brand-green)] active:scale-95 disabled:opacity-50 sm:px-3 sm:text-sm"
            aria-label="Mark as sold"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span className="xs:inline">Sold</span>
          </button>
        </>
      )}

      {/* Overflow menu (Edit, Delete) */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={busy}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 active:scale-95"
          aria-label="More actions"
          aria-expanded={open}
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
            <Link
              href={`/dashboard/edit/${vehicleId}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50"
            >
              <Edit3 className="h-3.5 w-3.5 text-gray-500" />
              Edit
            </Link>
            <button
              type="button"
              onClick={deleteAd}
              className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}