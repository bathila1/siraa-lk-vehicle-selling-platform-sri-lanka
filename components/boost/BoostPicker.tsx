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
              'w-full text-left bg-white rounded-xl border-2 p-4 transition-all',
              selected
                ? 'border-[var(--brand-green)] shadow-sm'
                : 'border-[var(--color-border)] hover:border-gray-300',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {isPro ? (
                    <Zap className="w-4 h-4 text-amber-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-[var(--brand-green)]" />
                  )}
                  <p className="font-semibold text-sm">{plan.name}</p>
                  {isPro && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                      Best Value
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed pr-2">
                  {plan.description}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-base text-[var(--brand-deep)]">
                  {formatLKR(plan.price)}
                </p>
                <p className="text-[10px] text-gray-400">
                  for {plan.duration_days} day{plan.duration_days === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {selected && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-1.5 text-xs text-[var(--brand-green)]">
                <Check className="w-3.5 h-3.5" />
                Selected
              </div>
            )}
          </button>
        );
      })}

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      {/* Sticky bottom action bar on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] p-3 z-30 md:relative md:bg-transparent md:border-0 md:p-0 md:pt-3">
        <div className="max-w-2xl mx-auto">
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
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Secure payment via PayHere · Cards, eZ Cash & bank transfers accepted
          </p>
        </div>
      </div>
    </div>
  );
}
