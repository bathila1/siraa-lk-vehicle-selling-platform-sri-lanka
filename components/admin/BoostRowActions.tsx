'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, X, Play, Square } from 'lucide-react';

interface Props {
  boostId: number;
  status: string;
}

export function BoostRowActions({ boostId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const callApi = async (action: string, payload: any = {}) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/boosts/${boostId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
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

  const handleActivate = async () => {
    const daysStr = prompt('How many days should this boost run from now?', '7');
    if (!daysStr) return;
    const days = parseInt(daysStr);
    if (!days || days < 1 || days > 365) return alert('Enter 1-365 days.');
    if (!confirm(`Activate boost for ${days} days?`)) return;
    await callApi('activate', { days });
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this boost?')) return;
    await callApi('cancel');
  };

  const handleExpire = async () => {
    if (!confirm('Expire this boost now?')) return;
    await callApi('expire');
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {(status === 'pending' || status === 'expired' || status === 'cancelled') && (
        <button
          onClick={handleActivate}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
          title="Manually activate"
        >
          <Play className="h-3 w-3" />
          Activate
        </button>
      )}
      {status === 'active' && (
        <button
          onClick={handleExpire}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
          title="Expire now"
        >
          <Square className="h-3 w-3" />
          Expire
        </button>
      )}
      {status !== 'cancelled' && status !== 'expired' && (
        <button
          onClick={handleCancel}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
          title="Cancel"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      )}
    </div>
  );
}