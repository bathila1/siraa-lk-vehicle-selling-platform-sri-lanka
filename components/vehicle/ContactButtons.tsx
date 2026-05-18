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

export function ContactButtons({ phone, whatsapp, vehicleId, vehicleTitle, price }: ContactButtonsProps) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = async () => {
    setRevealed(true);
    // Fire-and-forget — increment reveal count in DB
    fetch(`/api/vehicles/${vehicleId}/reveal`, { method: 'POST' }).catch(() => {});
  };

  const waMessage = `Hi, I'm interested in your ${vehicleTitle} listed on Siraa.lk for ${new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(price)}. Is it still available?`;

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 space-y-3">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Contact Seller</p>

      {!revealed ? (
        <Button variant="outline" size="lg" className="w-full" onClick={handleReveal}>
          <Phone className="w-4 h-4" />
          Show Number
        </Button>
      ) : (
        <a
          href={callLink(phone)}
          className="flex items-center justify-center gap-2 w-full bg-[var(--brand-green)] text-white font-medium py-3 px-4 rounded-lg hover:bg-[var(--brand-deep)] transition-colors text-sm"
        >
          <Phone className="w-4 h-4" />
          {phone}
        </a>
      )}

      <a
        href={whatsappLink(whatsapp, waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-medium py-3 px-4 rounded-lg hover:bg-[#1ebe5d] transition-colors text-sm"
        onClick={() => !revealed && handleReveal()}
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>

      {revealed && (
        <a
          href={callLink(phone)}
          className="flex items-center justify-center gap-2 w-full border border-[var(--color-border)] text-gray-700 font-medium py-3 px-4 rounded-lg hover:border-[var(--brand-green)] hover:text-[var(--brand-green)] transition-colors text-sm"
        >
          <Phone className="w-4 h-4" />
          Call Now
        </a>
      )}
    </div>
  );
}
