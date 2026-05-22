'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';

interface Plan {
  id: number;
  name: string;
  type: string;
  duration_days: number;
  price: number;
}

interface VehicleResult {
  id: number;
  slug: string;
  title: string;
  seller_phone: string;
}

interface Props {
  plans: Plan[];
}

export function ManualBoostForm({ plans }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VehicleResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<VehicleResult | null>(null);

  const [planId, setPlanId] = useState<number | null>(plans[0]?.id ?? null);
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/boosts/search-vehicle?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setError('Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!selected || !planId) {
      setError('Pick a vehicle and a plan.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selected.id,
          planId,
          days,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed.');
        return;
      }
      router.push('/admin/boosts');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Link
        href="/admin/boosts"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--brand-green)]"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to boosts
      </Link>

      {/* Step 1: vehicle */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">1. Select vehicle</h2>

        {selected ? (
          <div className="flex items-center justify-between rounded-lg border border-[var(--brand-green)] bg-[var(--brand-bg)] p-3">
            <div>
              <p className="font-medium text-sm">{selected.title}</p>
              <p className="text-xs text-gray-500 font-mono">{selected.seller_phone}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-gray-500 hover:text-red-500"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by model, slug, or seller phone..."
                  className="w-full rounded-lg border border-[var(--color-border)] py-2 pl-10 pr-3 text-sm outline-none focus:border-[var(--brand-green)]"
                />
              </div>
              <Button variant="primary" size="md" onClick={handleSearch} loading={searching}>
                Search
              </Button>
            </div>

            {results.length > 0 && (
              <ul className="mt-3 max-h-60 space-y-1 overflow-y-auto">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(r);
                        setResults([]);
                        setQuery('');
                      }}
                      className="w-full rounded-lg border border-[var(--color-border)] p-2 text-left text-sm hover:border-[var(--brand-green)] hover:bg-gray-50"
                    >
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-gray-500 font-mono">{r.seller_phone}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Step 2: plan */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">2. Choose plan & duration</h2>
        <div className="space-y-2">
          {plans.map((p) => (
            <label
              key={p.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                planId === p.id
                  ? 'border-[var(--brand-green)] bg-[var(--brand-bg)]'
                  : 'border-[var(--color-border)] hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="plan"
                checked={planId === p.id}
                onChange={() => {
                  setPlanId(p.id);
                  setDays(p.duration_days);
                }}
                className="accent-[var(--brand-green)]"
              />
              <Zap className={`h-4 w-4 ${p.type === 'pro' ? 'text-amber-500' : 'text-[var(--brand-green)]'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{p.name}</p>
                <p className="text-xs text-gray-500">{p.duration_days} days default · normally Rs.{p.price.toLocaleString()}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-gray-700">Duration (days)</label>
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value))))}
            className="w-32 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
      </section>

      {/* Step 3: reason */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">3. Reason (audit log)</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Promotional boost for early seller, compensation for service issue, etc."
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-green)]"
        />
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={handleCreate}
          loading={submitting}
          disabled={!selected || !planId}
        >
          <Zap className="h-4 w-4" />
          Create Manual Boost
        </Button>
      </div>
    </div>
  );
}