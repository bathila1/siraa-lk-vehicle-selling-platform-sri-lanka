'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Phone, Lock } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export function AdminLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  const submit = async () => {
    setError(null);

    if (!phone.match(/^(\+?94|0)7\d{8}$/)) {
      setError('Enter a valid mobile number.');
      return;
    }
    if (password.length < 4) {
      setError('Enter your password.');
      return;
    }
    if (!captchaToken) {
      setError('Please complete the verification first.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Wrong credentials.');
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      router.push('/admin');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Admin mobile number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="tel"
            inputMode="tel"
            placeholder="07x xxx xxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full rounded-lg border-2 border-[var(--color-border)] py-3 pl-10 pr-3 text-base outline-none focus:border-[var(--brand-green)]"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="••••••••"
            className="w-full rounded-lg border-2 border-[var(--color-border)] py-3 pl-10 pr-3 text-base outline-none focus:border-[var(--brand-green)]"
          />
        </div>
      </div>

      {siteKey && (
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            options={{ size: 'flexible', appearance: 'interaction-only' }}
            onSuccess={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={submit}
        loading={loading}
        disabled={!captchaToken}
      >
        <Lock className="h-4 w-4" />
        Sign In
      </Button>
    </div>
  );
}