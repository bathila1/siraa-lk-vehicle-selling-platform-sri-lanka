'use client';

import { useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { maskPhone, callLink, whatsappLink } from '@/lib/utils';

interface ContactButtonsProps {
  phone: string;
  whatsapp: string;
  vehicleId: number;
  vehicleTitle: string;
  price: number;
}

export function ContactButtons({
  phone,
  whatsapp,
  vehicleId,
  vehicleTitle,
  price,
}: ContactButtonsProps) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = async () => {
    setRevealed(true);
    // Fire-and-forget — increment reveal count in DB
    fetch(`/api/vehicles/${vehicleId}/reveal`, { method: 'POST' }).catch(() => {});
  };

  const waMessage = `Hi, I'm interested in your ${vehicleTitle} listed on Siraa.lk for ${new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(price)}. Is it still available?`;

  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact Seller</p>

      {!revealed ? (
        <Button variant="outline" size="lg" className="w-full" onClick={handleReveal}>
          <Phone className="h-4 w-4" />
          Show Number
        </Button>
      ) : (
        <a
          href={callLink(phone)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-green)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-deep)]"
        >
          <Phone className="h-4 w-4" />
          {phone}
        </a>
      )}

      <a
        href={whatsappLink(whatsapp, waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1ebe5d]"
        onClick={() => !revealed && handleReveal()}
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>

      {revealed && (
        <a
          href={callLink(phone)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
        >
          <Phone className="h-4 w-4" />
          Call Now
        </a>
      )}
    </div>
  );
}
