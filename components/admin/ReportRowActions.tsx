'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, EyeOff } from 'lucide-react';

interface Props {
  reportId: number;
  vehicleId: number;
}

export function ReportRowActions({ reportId, vehicleId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const callApi = async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
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

  const handleResolveAndHide = async () => {
    const notes = prompt('Admin notes (optional):') ?? '';
    if (!confirm('Hide the listing AND mark report resolved?')) return;
    await callApi('resolve_and_hide', { adminNotes: notes, vehicleId });
  };

  const handleDismiss = async () => {
    const notes = prompt('Reason for dismissing (admin notes):') ?? '';
    if (!confirm('Dismiss this report (no action on vehicle)?')) return;
    await callApi('dismiss', { adminNotes: notes });
  };

  const handleResolveNoAction = async () => {
    if (!confirm('Mark resolved without hiding the vehicle?')) return;
    await callApi('resolve', { adminNotes: 'Reviewed — no action needed.' });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={handleResolveAndHide}
        disabled={busy}
        className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 inline-flex items-center gap-1"
      >
        <EyeOff className="w-3 h-3" />
        Hide & Resolve
      </button>
      <button
        onClick={handleResolveNoAction}
        disabled={busy}
        className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 inline-flex items-center gap-1"
      >
        <CheckCircle2 className="w-3 h-3" />
        Resolve
      </button>
      <button
        onClick={handleDismiss}
        disabled={busy}
        className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100 inline-flex items-center gap-1"
      >
        <XCircle className="w-3 h-3" />
        Dismiss
      </button>
    </div>
  );
}
