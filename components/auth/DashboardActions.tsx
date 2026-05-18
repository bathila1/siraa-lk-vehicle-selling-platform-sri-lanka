'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Edit3, CheckSquare, Trash2 } from 'lucide-react';

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
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-30 overflow-hidden">
          <Link
            href={`/dashboard/edit/${vehicleId}`}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
            Edit
          </Link>
          {!isSold && (
            <button
              type="button"
              onClick={markSold}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
            >
              <CheckSquare className="w-3.5 h-3.5 text-gray-500" />
              Mark as sold
            </button>
          )}
          <button
            type="button"
            onClick={deleteAd}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
