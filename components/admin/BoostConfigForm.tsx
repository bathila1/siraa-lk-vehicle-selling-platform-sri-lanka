'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Zap, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface Plan {
  id: number;
  name: string;
  type: string;
  price: number;
  duration_days: number;
  description: string | null;
  active: boolean;
}

interface Slot {
  slot_key: string;
  count: number;
  description: string | null;
}

interface Props {
  plans: Plan[];
  slots: Slot[];
}

export function BoostConfigForm({ plans: initialPlans, slots: initialSlots }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [slots, setSlots] = useState(initialSlots);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const updatePlan = (id: number, patch: Partial<Plan>) => {
    setPlans((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const updateSlot = (key: string, patch: Partial<Slot>) => {
    setSlots((s) => s.map((x) => (x.slot_key === key ? { ...x, ...patch } : x)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/boost-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans, slots }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Save failed.');
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plans */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4 md:p-6">
        <h2 className="font-semibold mb-1 text-base">Boost Plans</h2>
        <p className="text-xs text-gray-500 mb-4">Pricing visible to sellers when boosting.</p>

        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start pb-4 border-b border-[var(--color-border)] last:border-0 last:pb-0">
              <div className="md:col-span-3 flex items-center gap-2">
                {plan.type === 'pro' ? (
                  <Zap className="w-4 h-4 text-amber-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-[var(--brand-green)]" />
                )}
                <div>
                  <p className="font-medium text-sm">{plan.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{plan.type}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Price (LKR)</label>
                <input
                  type="number"
                  value={plan.price}
                  onChange={(e) => updatePlan(plan.id, { price: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded outline-none focus:border-[var(--brand-green)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={plan.duration_days}
                  onChange={(e) => updatePlan(plan.id, { duration_days: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded outline-none focus:border-[var(--brand-green)]"
                />
              </div>

              <div className="md:col-span-4">
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <input
                  type="text"
                  value={plan.description ?? ''}
                  onChange={(e) => updatePlan(plan.id, { description: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded outline-none focus:border-[var(--brand-green)]"
                />
              </div>

              <div className="md:col-span-1 flex items-center justify-end">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plan.active}
                    onChange={(e) => updatePlan(plan.id, { active: e.target.checked })}
                    className="accent-[var(--brand-green)]"
                  />
                  Active
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Slot Config */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4 md:p-6">
        <h2 className="font-semibold mb-1 text-base">Slot Counts</h2>
        <p className="text-xs text-gray-500 mb-4">How many boosted ads to show in each location.</p>

        <div className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.slot_key} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-12 md:col-span-5">
                <p className="font-medium text-sm font-mono">{slot.slot_key}</p>
                {slot.description && (
                  <p className="text-xs text-gray-500">{slot.description}</p>
                )}
              </div>
              <div className="col-span-12 md:col-span-3">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={slot.count}
                  onChange={(e) => updateSlot(slot.slot_key, { count: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] rounded outline-none focus:border-[var(--brand-green)]"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-white border-t border-[var(--color-border)] -mx-4 -mb-4 md:-mx-6 md:-mb-6 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {savedAt && Date.now() - savedAt < 5000 ? '✓ Saved' : ''}
        </p>
        <Button variant="primary" size="md" onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
