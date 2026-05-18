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
      const ids = raw ? JSON.parse(raw) as number[] : [];
      setSavedIds(ids);
    } catch {
      setSavedIds([]);
    }
  }, []);

  useEffect(() => {
    if (savedIds.length === 0) { setLoading(false); return; }

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          Saved Vehicles
          {savedIds.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({savedIds.length})</span>
          )}
        </h1>
        {savedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} loading={sharing}>
              <Share2 className="w-3.5 h-3.5" />
              Share List
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {shareUrl && (
        <div className="bg-[var(--brand-bg)] border border-[var(--brand-mint)] rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--brand-deep)]">Share link copied! 🎉</p>
            <p className="text-xs text-gray-500 mt-0.5 break-all">{shareUrl}</p>
          </div>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <ExternalLink className="w-4 h-4 text-[var(--brand-green)]" />
          </a>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm">Loading...</div>
      ) : savedIds.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No saved vehicles yet</p>
          <p className="text-sm text-gray-400 mb-6">Tap the heart on any vehicle to save it here</p>
          <Link href="/search" className="text-[var(--brand-green)] hover:underline text-sm">
            Browse vehicles →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center gap-4 bg-white border border-[var(--color-border)] rounded-xl p-3 hover:border-[var(--brand-green)] transition-colors">
              {v.image && (
                <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img src={v.image} alt={v.title} className="object-cover w-full h-full" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/vehicle/${v.slug}`} className="font-medium text-sm hover:text-[var(--brand-green)] truncate block">
                  {v.title}
                </Link>
                <p className="text-[var(--brand-deep)] font-bold text-sm mt-0.5">{formatLKR(v.price)}</p>
                <p className="text-xs text-gray-400">{v.location}</p>
              </div>
              <button
                onClick={() => remove(v.id)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove from saved"
              >
                <Heart className="w-4 h-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}