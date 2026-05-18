'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Share2, Trash2, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { formatLKR } from '@/lib/utils';

const STORAGE_KEY = 'siraa_saved_ids';

interface SavedVehicle {
  id: number;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  location: string;
}

export function SavedListClient() {
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [vehicles, setVehicles] = useState<SavedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as number[]) : [];
      setSavedIds(ids);
    } catch {
      setSavedIds([]);
    }
  }, []);

  useEffect(() => {
    if (savedIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchVehicles = async () => {
      try {
        const res = await fetch(`/api/vehicles/batch?ids=${savedIds.join(',')}`);
        const data = await res.json();
        setVehicles(data.vehicles ?? []);
      } catch {
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [savedIds]);

  const remove = (id: number) => {
    const next = savedIds.filter((i) => i !== id);
    setSavedIds(next);
    setVehicles((v) => v.filter((v) => v.id !== id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setShareUrl(null);
  };

  const clearAll = () => {
    setSavedIds([]);
    setVehicles([]);
    localStorage.removeItem(STORAGE_KEY);
    setShareUrl(null);
  };

  const handleShare = async () => {
    if (savedIds.length === 0) return;
    setSharing(true);
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleIds: savedIds }),
      });
      const data = await res.json();
      const url = `${window.location.origin}/list/${data.shareCode}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url).catch(() => {});
    } catch {
      alert('Failed to create share link. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Heart className="h-5 w-5 fill-red-500 text-red-500" />
          Saved Vehicles
          {savedIds.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({savedIds.length})</span>
          )}
        </h1>
        {savedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} loading={sharing}>
              <Share2 className="h-3.5 w-3.5" />
              Share List
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {shareUrl && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[var(--brand-mint)] bg-[var(--brand-bg)] p-4">
          <div>
            <p className="text-sm font-medium text-[var(--brand-deep)]">Share link copied! 🎉</p>
            <p className="mt-0.5 break-all text-xs text-gray-500">{shareUrl}</p>
          </div>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <ExternalLink className="h-4 w-4 text-[var(--brand-green)]" />
          </a>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading...</div>
      ) : savedIds.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-gray-200" />
          <p className="mb-2 text-gray-500">No saved vehicles yet</p>
          <p className="mb-6 text-sm text-gray-400">Tap the heart on any vehicle to save it here</p>
          <Link href="/search" className="text-sm text-[var(--brand-green)] hover:underline">
            Browse vehicles →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white p-3 transition-colors hover:border-[var(--brand-green)]"
            >
              {v.image && (
                <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <img src={v.image} alt={v.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/vehicle/${v.slug}`}
                  className="block truncate text-sm font-medium hover:text-[var(--brand-green)]"
                >
                  {v.title}
                </Link>
                <p className="mt-0.5 text-sm font-bold text-[var(--brand-deep)]">
                  {formatLKR(v.price)}
                </p>
                <p className="text-xs text-gray-400">{v.location}</p>
              </div>
              <button
                onClick={() => remove(v.id)}
                className="flex-shrink-0 p-2 text-gray-400 transition-colors hover:text-red-500"
                aria-label="Remove from saved"
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
