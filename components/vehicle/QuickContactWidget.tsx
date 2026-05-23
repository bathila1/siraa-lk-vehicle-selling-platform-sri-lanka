'use client';

import { useEffect, useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';

import { callLink, whatsappLink, formatLKR } from '@/lib/utils';

interface Props {
  phone: string;
  whatsapp: string;
  vehicleId: number;
  vehicleTitle: string;
  price: number;
}

/**
 * Floating quick-contact dock that appears at the bottom of vehicle detail
 * pages after the user scrolls past the main contact card. Disappears when
 * they scroll back up so it doesn't get in the way.
 *
 * Mobile-first: shows fixed at bottom with safe-area padding.
 * Desktop: appears as a smaller pill in the bottom-right corner.
 */
export function QuickContactWidget({
  phone,
  whatsapp,
  vehicleId,
  vehicleTitle,
  price,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let lastY = 0;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        // Show after scrolling  (past the contact card)
        // Hide if scrolling back up fast
        if (y >= 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const recordReveal = () => {
    if (revealed) return;
    setRevealed(true);
    fetch(`/api/vehicles/${vehicleId}/reveal`, { method: 'POST' }).catch(() => {});
  };

  const waMessage = `Hi, I'm interested in your ${vehicleTitle} (${formatLKR(price)}) on Siraa.lk. Is it still available?`;

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-white shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)] md:bottom-4 md:left-auto md:right-4 md:max-w-md md:rounded-2xl md:border md:shadow-xl"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        animation: 'slideUp 0.25s ease-out',
      }}
    >
      <div className="flex items-center gap-2 p-3">
        {/* Quick info — hidden on mobile to save space */}
        <div className="hidden flex-1 min-w-0 md:block">
          <p className="truncate text-xs text-gray-500">Contact seller</p>
          <p className="truncate text-sm font-medium">{formatLKR(price)}</p>
        </div>

        {/* Call button */}
        <a
          href={callLink(phone)}
          onClick={recordReveal}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-3 text-sm font-medium text-white shadow-sm transition-all active:scale-95 md:flex-initial md:px-4"
        >
          <Phone className="h-4 w-4" />
          <span className="md:inline">Call</span>
        </a>

        {/* WhatsApp button */}
        <a
          href={whatsappLink(whatsapp, waMessage)}
          target="_blank"
          rel="noopener"
          onClick={recordReveal}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-sm font-medium text-white shadow-sm transition-all active:scale-95 md:flex-initial md:px-4"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          <span className="md:inline">WhatsApp</span>
        </a>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
