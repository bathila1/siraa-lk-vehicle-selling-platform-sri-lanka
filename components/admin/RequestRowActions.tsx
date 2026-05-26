'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle, MoreVertical, Check, X, AlertCircle } from 'lucide-react';

import { whatsappLink, callLink } from '@/lib/utils';

interface Props {
  requestId: number;
  status: string;
  phone: string;
  whatsappPref: boolean;
  waMessage: string;
}

export function RequestRowActions({
  requestId,
  status,
  phone,
  whatsappPref,
  waMessage,
}: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const updateStatus = async (newStatus: string, markContacted = false) => {
    setBusy(true);
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          markContacted,
        }),
      });
      if (!res.ok) {
        alert('Failed to update.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleContact = (method: 'whatsapp' | 'call') => {
    // Mark as in_progress + contacted when opening
    updateStatus('in_progress', true);
    // Then open the contact link
    if (method === 'whatsapp') {
      window.open(whatsappLink(phone, waMessage), '_blank');
    } else {
      window.location.href = callLink(phone);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Primary contact buttons */}
      <button
        type="button"
        onClick={() => handleContact('whatsapp')}
        disabled={busy}
        className="flex h-9 items-center gap-1 rounded-lg bg-[#25D366] px-2.5 text-xs font-medium text-white shadow-sm active:scale-95"
      >
        <MessageCircle className="h-3.5 w-3.5 fill-current" />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>
      <button
        type="button"
        onClick={() => handleContact('call')}
        disabled={busy}
        className="flex h-9 items-center gap-1 rounded-lg bg-[var(--brand-green)] px-2.5 text-xs font-medium text-white shadow-sm active:scale-95"
      >
        <Phone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Call</span>
      </button>

      {/* Status menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          disabled={busy}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100"
          aria-label="Status menu"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
              {status !== 'fulfilled' && (
                <button
                  type="button"
                  onClick={() => updateStatus('fulfilled')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <Check className="h-3.5 w-3.5 text-[var(--brand-green)]" />
                  Mark fulfilled
                </button>
              )}
              {status !== 'in_progress' && (
                <button
                  type="button"
                  onClick={() => updateStatus('in_progress')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  In progress
                </button>
              )}
              {status !== 'closed' && (
                <button
                  type="button"
                  onClick={() => updateStatus('closed')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                  Close
                </button>
              )}
              {status !== 'spam' && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Mark this request as spam?')) updateStatus('spam');
                  }}
                  className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Mark spam
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
