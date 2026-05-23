'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, Inbox } from 'lucide-react';

import { timeAgo } from '@/lib/utils';

interface Notification {
  id: number;
  category: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * Notification bell with dropdown panel.
 *
 * Fetches once on mount, then polls every 60s for unread count.
 * Lightweight: only the count is polled, the full list loads on click.
 *
 * Should be placed inside <Header /> after session is confirmed.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Initial fetch + polling
  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/count', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnreadCount(data.unread ?? 0);
      } catch {
        // silent
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60_000); // every minute
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Load list when opening
  const handleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (items.length === 0) {
      setLoading(true);
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setItems(data.notifications ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleItemClick = async (n: Notification) => {
    if (!n.read_at) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item)),
      );
      fetch(`/api/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2.5">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[var(--brand-green)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-xs text-gray-400">Loading...</div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <Inbox className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              items.map((n) => {
                const inner = (
                  <div
                    className={`flex gap-3 border-b border-[var(--color-border)] px-3 py-2.5 last:border-0 transition-colors ${
                      n.read_at ? 'bg-white' : 'bg-[var(--brand-bg)]'
                    } hover:bg-gray-50`}
                  >
                    {!n.read_at && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--brand-green)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          n.read_at ? 'text-gray-700' : 'font-medium text-[var(--brand-black)]'
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                );

                return n.link_url ? (
                  <Link
                    key={n.id}
                    href={n.link_url}
                    onClick={() => {
                      handleItemClick(n);
                      setOpen(false);
                    }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="cursor-pointer"
                  >
                    {inner}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-[var(--color-border)] bg-gray-50 px-3 py-2 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:text-[var(--brand-green)]"
              >
                View all →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
