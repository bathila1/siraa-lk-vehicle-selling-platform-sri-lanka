'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeOff, CheckSquare, Eye } from 'lucide-react';

export function VehicleRowActions({ vehicleId, status }: { vehicleId: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const callAction = async (action: 'hide' | 'unhide' | 'mark_sold', reason?: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Failed.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleHide = async () => {
    const reason = prompt('Reason for hiding (admin notes only):');
    if (reason === null) return;
    if (!confirm('Hide this vehicle from public listings?')) return;
    await callAction('hide', reason || undefined);
  };

  const handleUnhide = async () => {
    if (!confirm('Unhide this vehicle?')) return;
    await callAction('unhide');
  };

  const handleMarkSold = async () => {
    if (!confirm('Mark this vehicle as sold?')) return;
    await callAction('mark_sold');
  };

  if (status === 'hidden') {
    return (
      <button
        onClick={handleUnhide}
        disabled={busy}
        className="text-xs px-2 py-1 rounded text-[var(--brand-green)] hover:bg-green-50 inline-flex items-center gap-1"
      >
        <Eye className="w-3 h-3" />
        Unhide
      </button>
    );
  }

  if (status === 'sold') {
    return (
      <button
        onClick={handleHide}
        disabled={busy}
        className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
      >
        <EyeOff className="w-3 h-3" />
        Hide
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={handleMarkSold}
        disabled={busy}
        className="text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-100 inline-flex items-center gap-1"
        title="Mark sold"
      >
        <CheckSquare className="w-3 h-3" />
        Sold
      </button>
      <button
        onClick={handleHide}
        disabled={busy}
        className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
      >
        <EyeOff className="w-3 h-3" />
        Hide
      </button>
    </div>
  );
}
