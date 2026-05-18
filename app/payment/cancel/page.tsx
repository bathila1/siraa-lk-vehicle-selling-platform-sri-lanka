import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { createServiceClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Payment Cancelled' };

interface Props {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function PaymentCancelPage({ searchParams }: Props) {
  const { order_id } = await searchParams;

  // Best-effort: mark our local payment as cancelled if it's still pending
  if (order_id) {
    const supabase = createServiceClient();
    const { data: payment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('gateway_order_id', order_id)
      .maybeSingle();

    if (payment && payment.status === 'pending') {
      await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('id', payment.id);

      await supabase
        .from('boosts')
        .update({ status: 'cancelled' })
        .eq('payment_id', payment.id)
        .eq('status', 'pending');
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 py-10 bg-[var(--brand-bg)]">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[var(--color-border)] p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold mb-2">Payment cancelled</h1>
          <p className="text-sm text-gray-500 mb-6">
            No worries — your card wasn&apos;t charged. You can boost your ad anytime from your dashboard.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-[var(--brand-green)] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[var(--brand-deep)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
