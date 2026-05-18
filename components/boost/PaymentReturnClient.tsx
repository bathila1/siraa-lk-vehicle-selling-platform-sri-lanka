'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'completed' | 'pending' | 'failed' | 'cancelled' | 'not_found' | 'timeout';

const MAX_POLL_SECONDS = 60;
const POLL_INTERVAL_MS = 3_000;

export function PaymentReturnClient({ orderId }: { orderId: string | null }) {
  const [status, setStatus] = useState<Status>('loading');
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setStatus('not_found');
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(`/api/payment/status?order_id=${encodeURIComponent(orderId)}`);
        if (cancelled) return;

        if (res.status === 404) {
          setStatus('not_found');
          return;
        }

        const data = await res.json();
        const s: Status = data.status ?? 'pending';
        setStatus(s);

        const elapsedMs = Date.now() - startedAt;
        setElapsedSec(Math.floor(elapsedMs / 1000));

        // Stop polling on terminal status
        if (s === 'completed' || s === 'failed' || s === 'cancelled') return;

        // Stop polling after timeout
        if (elapsedMs >= MAX_POLL_SECONDS * 1000) {
          setStatus('timeout');
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  if (!orderId || status === 'not_found') {
    return (
      <Body
        icon={<AlertCircle className="w-12 h-12 text-amber-500" />}
        title="Payment not found"
        message="We couldn't find your payment record. If you were charged, please contact support."
        actions={
          <Link href="/dashboard" className="text-sm text-[var(--brand-green)] hover:underline">
            Back to dashboard →
          </Link>
        }
      />
    );
  }

  if (status === 'completed') {
    return (
      <Body
        icon={<CheckCircle2 className="w-12 h-12 text-[var(--brand-green)]" />}
        title="Boost activated! 🎉"
        message="Your ad is now featured. Buyers will start seeing it at the top of search results."
        actions={
          <Link
            href="/dashboard"
            className="inline-block bg-[var(--brand-green)] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[var(--brand-deep)]"
          >
            Go to Dashboard
          </Link>
        }
      />
    );
  }

  if (status === 'failed') {
    return (
      <Body
        icon={<XCircle className="w-12 h-12 text-red-500" />}
        title="Payment failed"
        message="Your payment didn't go through. Your card hasn't been charged. You can try again from your dashboard."
        actions={
          <Link href="/dashboard" className="text-sm text-[var(--brand-green)] hover:underline">
            Back to dashboard →
          </Link>
        }
      />
    );
  }

  if (status === 'cancelled') {
    return (
      <Body
        icon={<AlertCircle className="w-12 h-12 text-gray-400" />}
        title="Payment cancelled"
        message="You cancelled the payment. No charges were made."
        actions={
          <Link href="/dashboard" className="text-sm text-[var(--brand-green)] hover:underline">
            Back to dashboard →
          </Link>
        }
      />
    );
  }

  if (status === 'timeout') {
    return (
      <Body
        icon={<AlertCircle className="w-12 h-12 text-amber-500" />}
        title="Still confirming..."
        message="Your payment is taking longer than expected. If you completed payment, please check your dashboard in a few minutes. If you have any issues, contact support."
        actions={
          <Link href="/dashboard" className="text-sm text-[var(--brand-green)] hover:underline">
            Back to dashboard →
          </Link>
        }
      />
    );
  }

  // Default: loading / pending
  return (
    <Body
      icon={<Loader2 className="w-12 h-12 text-[var(--brand-green)] animate-spin" />}
      title="Confirming your payment..."
      message="This usually takes a few seconds. Please don't close this page."
      actions={
        <p className="text-xs text-gray-400">
          {elapsedSec > 0 && `Waiting ${elapsedSec}s...`}
        </p>
      }
    />
  );
}

function Body({
  icon,
  title,
  message,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="text-center py-4">
      <div className="flex justify-center mb-4">{icon}</div>
      <h1 className="text-lg font-bold mb-2">{title}</h1>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
      {actions}
    </div>
  );
}
