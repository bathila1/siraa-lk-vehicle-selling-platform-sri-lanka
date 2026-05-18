'use client';

import { useState } from 'react';
import { Check, Zap, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { formatLKR, cn } from '@/lib/utils';

interface Plan {
  id: number;
  name: string;
  type: 'normal' | 'pro' | string;
  price: number;
  duration_days: number;
  description: string | null;
}

interface Props {
  vehicleId: number;
  plans: Plan[];
}

export function BoostPicker({ vehicleId, plans }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(plans[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProceed = async () => {
    if (!selectedId) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, planId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to start payment.');
        return;
      }

      // Build hidden form and auto-submit to PayHere
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.checkoutUrl;
      form.style.display = 'none';

      Object.entries(data.fields as Record<string, string>).forEach(([key, val]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(val);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const isPro = plan.type === 'pro';
        const selected = selectedId === plan.id;
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedId(plan.id)}
            className={cn(
              'w-full rounded-xl border-2 bg-white p-4 text-left transition-all',
              selected
                ? 'border-[var(--brand-green)] shadow-sm'
                : 'border-[var(--color-border)] hover:border-gray-300',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {isPro ? (
                    <Zap className="h-4 w-4 text-amber-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-[var(--brand-green)]" />
                  )}
                  <p className="text-sm font-semibold">{plan.name}</p>
                  {isPro && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                      Best Value
                    </span>
                  )}
                </div>
                <p className="pr-2 text-xs leading-relaxed text-gray-500">{plan.description}</p>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-base font-bold text-[var(--brand-deep)]">
                  {formatLKR(plan.price)}
                </p>
                <p className="text-[10px] text-gray-400">
                  for {plan.duration_days} day{plan.duration_days === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {selected && (
              <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--brand-green)]">
                <Check className="h-3.5 w-3.5" />
                Selected
              </div>
            )}
          </button>
        );
      })}

      {error && <p className="text-center text-xs text-red-500">{error}</p>}

      {/* Sticky bottom action bar on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-white p-3 md:relative md:border-0 md:bg-transparent md:p-0 md:pt-3">
        <div className="mx-auto max-w-2xl">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleProceed}
            loading={loading}
            disabled={!selectedId}
          >
            Continue to Payment
          </Button>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            Secure payment via PayHere · Cards, eZ Cash & bank transfers accepted
          </p>
        </div>
      </div>
    </div>
  );
}
