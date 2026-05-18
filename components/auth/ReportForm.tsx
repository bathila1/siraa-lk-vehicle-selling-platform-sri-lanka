'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface Props {
  vehicleId: number;
  vehicleSlug: string;
}

const REASONS = [
  { value: 'sold', label: 'Already sold' },
  { value: 'scam', label: 'Looks like a scam' },
  { value: 'wrong_info', label: 'Wrong information' },
  { value: 'duplicate', label: 'Duplicate ad' },
  { value: 'other', label: 'Other' },
];

export function ReportForm({ vehicleId, vehicleSlug }: Props) {
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    if (!reason) {
      setError('Please choose a reason.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          reason,
          notes: notes || undefined,
          reporterPhone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-12 h-12 text-[var(--brand-green)] mx-auto mb-3" />
        <p className="font-medium text-[var(--brand-deep)]">Thanks!</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          We&apos;ll review this report shortly.
        </p>
        <Link
          href={`/vehicle/${vehicleSlug}`}
          className="text-sm text-[var(--brand-green)] hover:underline"
        >
          ← Back to the ad
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Why are you reporting it?</p>
        <div className="space-y-1.5">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                reason === r.value
                  ? 'border-[var(--brand-green)] bg-[var(--brand-bg)]'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={(e) => setReason(e.target.value)}
                className="accent-[var(--brand-green)]"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          More details (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Tell us more..."
          className="w-full p-3 text-sm border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          Your phone (optional — for follow-up)
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07x xxx xxxx"
          className="w-full p-3 text-sm border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={submit}
        loading={loading}
        disabled={!reason}
      >
        Submit Report
      </Button>

      <Link
        href={`/vehicle/${vehicleSlug}`}
        className="block text-center text-xs text-gray-500 hover:text-[var(--brand-green)]"
      >
        Cancel
      </Link>
    </div>
  );
}
