'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Phone, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/Button';

type Step = 'phone' | 'otp';

interface Props {
  redirectTo: string;
}

export function LoginForm({ redirectTo }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
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
      setError('Enter a valid Sri Lankan mobile number (07x xxx xxxx)');
      return;
    }

    if (!captchaToken) {
      setError('Verifying — please wait a moment and try again.');
      turnstileRef.current?.execute();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          purpose: 'seller_login',
          captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Try again.');
        // Reset captcha for next attempt
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      setStep('otp');
    } catch {
      setError('Network error. Check your connection.');
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
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, purpose: 'seller_login' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Wrong code.');
        return;
      }
      // If new seller without a name yet, go to profile setup
      router.push(data.needsProfile ? '/dashboard/profile?welcome=1' : redirectTo);
    } catch {
      setError('Network error. Check your connection.');
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
          Change number
        </button>

        <div>
          <p className="text-sm text-gray-700">
            Code sent to <strong>{phone}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Enter the 6-digit code from your SMS
          </p>
        </div>

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
          Verify & Continue
        </Button>

        <button
          onClick={requestOtp}
          disabled={loading}
          className="w-full text-xs text-gray-500 hover:text-[var(--brand-green)] py-2 flex items-center justify-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Resend code
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="phone" className="text-xs font-medium text-gray-700 mb-1.5 block">
          Mobile number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="07x xxx xxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && requestOtp()}
            className="w-full pl-10 pr-3 py-3 text-base border-2 border-[var(--color-border)] rounded-lg focus:border-[var(--brand-green)] outline-none"
            autoFocus
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          We&apos;ll send a 6-digit code via SMS.
        </p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={requestOtp}
        loading={loading}
      >
        Send Code
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        By continuing, you agree to our{' '}
        <a href="/terms" className="underline hover:text-[var(--brand-green)]">Terms</a> &{' '}
        <a href="/privacy" className="underline hover:text-[var(--brand-green)]">Privacy Policy</a>.
      </p>

      {/* Invisible Turnstile — auto-executes on mount */}
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
