'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RotateCw, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { timeAgo } from '@/lib/utils';

interface Props {
  boost: any;
  vehicleId: number;
}

export function PendingBoostActions({ boost, vehicleId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelPending = async () => {
    if (!confirm('Cancel this pending payment? You can then choose a new boost.')) return;
    setError(null);
    setBusy('cancel');
    try {
      const res = await fetch(`/api/boost/${boost.id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-900">Payment pending</p>
          <p className="mt-1 text-xs text-amber-700">
            Started {timeAgo(boost.created_at ?? new Date().toISOString())} —{' '}
            {boost.boost_plans?.name ?? 'boost'} for Rs.{boost.amount_paid?.toLocaleString()}.
          </p>
          <p className="mt-2 text-xs text-amber-700">
            If you completed payment, it&apos;ll activate automatically within a minute. If you cancelled or
            didn&apos;t finish, you can cancel this attempt and try again.
          </p>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.refresh()}
            >
              <RotateCw className="h-3.5 w-3.5" />
              Check status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cancelPending}
              loading={busy === 'cancel'}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
              Cancel & choose new
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}