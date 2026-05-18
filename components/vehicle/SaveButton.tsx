'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

const STORAGE_KEY = 'siraa_saved_ids';

export function SaveButton({ vehicleId }: { vehicleId: number }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as number[]) : [];
      setSaved(ids.includes(vehicleId));
    } catch { /* ignore */ }
  }, [vehicleId]);

  const toggle = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as number[]) : [];
      const next = saved
        ? ids.filter((i) => i !== vehicleId)
        : [...ids, vehicleId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(!saved);
    } catch { /* ignore */ }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center justify-center gap-1.5 w-full border font-medium py-3 px-4 rounded-lg transition-colors text-sm ${
        saved
          ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-[var(--color-border)] text-gray-700 hover:border-red-300 hover:text-red-500'
      }`}
      aria-label={saved ? 'Remove from saved' : 'Save vehicle'}
    >
      <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
