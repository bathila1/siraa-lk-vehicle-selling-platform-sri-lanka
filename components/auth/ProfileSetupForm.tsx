'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface Props {
  initialName: string;
  initialDistrictId: number | null;
  initialWhatsapp: string;
  phone: string;
  districts: { id: number; name_en: string }[];
}

export function ProfileSetupForm({
  initialName,
  initialDistrictId,
  initialWhatsapp,
  phone,
  districts,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [districtId, setDistrictId] = useState<number | null>(initialDistrictId);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp || phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!districtId) {
      setError('Please select your district.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim(),
          districtId,
          whatsappNumber: whatsapp || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          Your Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bathiya"
            maxLength={80}
            className="w-full pl-10 pr-3 py-3 text-sm border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          District <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
          <select
            value={districtId ?? ''}
            onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : null)}
            className="w-full pl-10 pr-3 py-3 text-sm border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
          >
            <option value="">Select your district</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name_en}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">
          WhatsApp Number
        </label>
        <div className="relative">
          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="tel"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder={phone}
            className="w-full pl-10 pr-3 py-3 text-sm border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Defaults to your phone number. Leave as is if same.
        </p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={submit}
        loading={loading}
      >
        Save & Continue
      </Button>
    </div>
  );
}
