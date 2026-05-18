'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Phone, Lock, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  const requestOtp = async () => {
    setError(null);
    if (!phone.match(/^(\+?94|0)7\d{8}$/)) {
      setError('Enter a valid mobile number.');
      return;
    }
    if (!captchaToken) {
      setError('Please wait a moment.');
      turnstileRef.current?.execute();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      setStep('otp');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    if (!code.match(/^\d{6}$/)) {
      setError('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Wrong code.');
        return;
      }
      router.push('/admin');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setStep('phone'); setCode(''); setError(null); }}
          className="text-xs text-gray-500 hover:text-[var(--brand-green)] flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>

        <p className="text-sm text-gray-700">Enter the code sent to your phone.</p>

        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
          placeholder="6-digit code"
          className="w-full text-lg tracking-widest text-center font-mono py-3 px-4 border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
          autoFocus
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={verifyOtp}
          loading={loading}
          disabled={code.length !== 6}
        >
          <Lock className="w-4 h-4" />
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 block">Admin mobile number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="tel"
            inputMode="tel"
            placeholder="07x xxx xxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && requestOtp()}
            className="w-full pl-10 pr-3 py-3 text-base border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
            autoFocus
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button variant="primary" size="lg" className="w-full" onClick={requestOtp} loading={loading}>
        Send Code
      </Button>

      {siteKey && (
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          options={{ size: 'invisible', execution: 'execute' }}
          onSuccess={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
        />
      )}
    </div>
  );
}
