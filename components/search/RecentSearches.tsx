'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, X, Search } from 'lucide-react';

interface RecentSearch {
  q: string;
  timestamp: number;
}

const STORAGE_KEY = 'siraa:recent_searches';
const MAX_ITEMS = 6;

/**
 * Save a search query to localStorage.
 * Call from SearchBar when a search is submitted.
 */
export function addRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: RecentSearch[] = raw ? JSON.parse(raw) : [];

    // Remove dupes (case-insensitive), then push new at front
    const filtered = existing.filter((s) => s.q.toLowerCase() !== trimmed.toLowerCase());
    const next = [{ q: trimmed, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage might be full / blocked — silent fail
  }
}

/**
 * Recent searches display block — shown on homepage and below empty search results.
 *
 * Pulls from localStorage, no DB call.
 * Each chip is a link back to /search with the same query.
 */
export function RecentSearches({
  className,
  title = 'Recent searches',
}: {
  className?: string;
  title?: string;
}) {
  const [items, setItems] = useState<RecentSearch[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const removeOne = (q: string) => {
    const next = items.filter((s) => s.q !== q);
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const clearAll = () => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Hide entirely on first render to avoid hydration mismatch flash
  if (!mounted || items.length === 0) return null;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium text-white">
          <Clock className="h-3 w-3" />
          {title}
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span
            key={s.q}
            className="group inline-flex items-center overflow-hidden rounded-full border border-[var(--color-border)] bg-white text-xs transition-colors hover:border-[var(--brand-green)]"
          >
            <Link
              href={`/search?q=${encodeURIComponent(s.q)}`}
              className="flex items-center gap-1 px-2.5 py-1 text-gray-700 hover:text-[var(--brand-green)]"
            >
              <Search className="h-2.5 w-2.5 text-gray-400" />
              {s.q}
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                removeOne(s.q);
              }}
              className="border-l border-[var(--color-border)] px-1.5 py-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label={`Remove ${s.q}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
