'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, CheckCircle2 } from 'lucide-react';

export function SellerRowActions({ sellerId, isBanned }: { sellerId: string; isBanned: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleToggleBan = async () => {
    const action = isBanned ? 'unban' : 'ban';
    let reason: string | null = null;
    if (action === 'ban') {
      reason = prompt('Reason for banning (visible only to admins):');
      if (reason === null) return;
    }
    if (!confirm(`Confirm ${action} this seller?`)) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}`, {
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

  return (
    <button
      type="button"
      onClick={handleToggleBan}
      disabled={busy}
      className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 transition-colors ${
        isBanned
          ? 'text-[var(--brand-green)] hover:bg-green-50'
          : 'text-red-600 hover:bg-red-50'
      }`}
    >
      {isBanned ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
      {isBanned ? 'Unban' : 'Ban'}
    </button>
  );
}
