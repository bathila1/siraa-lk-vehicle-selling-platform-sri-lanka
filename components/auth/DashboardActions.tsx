'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Edit3, CheckSquare, Trash2, Zap } from 'lucide-react';

interface Props {
  vehicleId: number;
  vehicleSlug: string;
  isSold: boolean;
}

export function DashboardActions({ vehicleId, isSold }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
          {!isSold && (
            <Link
              href={`/dashboard/boost/${vehicleId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--brand-deep)] transition-colors hover:bg-[var(--brand-bg)]"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Boost ad
            </Link>
          )}
          <Link
            href={`/dashboard/edit/${vehicleId}`}
            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
          >
            <Edit3 className="h-3.5 w-3.5 text-gray-500" />
            Edit
          </Link>
          {!isSold && (
            <button
              type="button"
              onClick={markSold}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
            >
              <CheckSquare className="h-3.5 w-3.5 text-gray-500" />
              Mark as sold
            </button>
          )}
          <button
            type="button"
            onClick={deleteAd}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
