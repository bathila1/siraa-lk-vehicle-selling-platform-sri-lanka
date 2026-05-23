'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, CheckCircle2, BadgeCheck, BadgeMinus } from 'lucide-react';

export function SellerRowActions({
  sellerId,
  isBanned,
  isTrusted,
}: {
  sellerId: string;
  isBanned: boolean;
  isTrusted: boolean;
}) {
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

  const handleToggleTrust = async () => {
    const action = isTrusted ? 'revoke' : 'grant';
    let reason: string | null = null;
    if (action === 'grant') {
      reason = prompt(
        'Why is this seller trusted? (e.g. "Verified dealer", "Repeat seller", "NIC checked")',
      );
      if (reason === null) return;
    } else {
      if (!confirm('Revoke trusted status?')) return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/trust`, {
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
    <div className="flex items-center justify-end gap-1">
      {/* Trust toggle */}
      <button
        type="button"
        onClick={handleToggleTrust}
        disabled={busy}
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
          isTrusted
            ? 'text-gray-600 hover:bg-gray-100'
            : 'text-blue-600 hover:bg-blue-50'
        }`}
        title={isTrusted ? 'Revoke trusted status' : 'Mark as trusted seller'}
      >
        {isTrusted ? (
          <>
            <BadgeMinus className="h-3 w-3" />
            Untrust
          </>
        ) : (
          <>
            <BadgeCheck className="h-3 w-3" />
            Trust
          </>
        )}
      </button>

      {/* Ban toggle */}
      <button
        type="button"
        onClick={handleToggleBan}
        disabled={busy}
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
          isBanned
            ? 'text-[var(--brand-green)] hover:bg-green-50'
            : 'text-red-600 hover:bg-red-50'
        }`}
      >
        {isBanned ? <CheckCircle2 className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
        {isBanned ? 'Unban' : 'Ban'}
      </button>
    </div>
  );
}
