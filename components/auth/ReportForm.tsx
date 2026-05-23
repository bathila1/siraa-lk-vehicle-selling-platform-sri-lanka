'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

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
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  const submit = async () => {
    setError(null);
    if (!reason) {
      setError('Please choose a reason.');
      return;
    }
    if (!captchaToken) {
      setError('Please complete the verification first.');
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
          reporterName: name || undefined,
          captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit.');
        turnstileRef.current?.reset();
        setCaptchaToken(null);
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
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-[var(--brand-green)]" />
        <p className="font-medium text-[var(--brand-deep)]">Thanks!</p>
        <p className="mb-4 mt-1 text-sm text-gray-500">
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
        <p className="mb-2 text-xs font-medium text-gray-700">Why are you reporting it?</p>
        <div className="space-y-1.5">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
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
        <label className="mb-1.5 block text-xs font-medium text-gray-700">
          More details (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Tell us more..."
          className="w-full resize-none rounded-lg border-2 border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--brand-green)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Your name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Optional"
            className="w-full rounded-lg border-2 border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Your phone (optional)
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07x xxx xxxx"
            className="w-full rounded-lg border-2 border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
      </div>

      {siteKey && (
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            options={{ size: 'flexible', appearance: 'interaction-only' }}
            onSuccess={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        </div>
      )}

      {!captchaToken && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Verifying you&apos;re human...
        </p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={submit}
        loading={loading}
        disabled={!reason || !captchaToken}
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
