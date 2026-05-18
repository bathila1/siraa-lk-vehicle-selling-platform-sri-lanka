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
      await supabase.from('payments').update({ status: 'cancelled' }).eq('id', payment.id);

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
      <main className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center bg-[var(--brand-bg)] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h1 className="mb-2 text-lg font-bold">Payment cancelled</h1>
          <p className="mb-6 text-sm text-gray-500">
            No worries — your card wasn&apos;t charged. You can boost your ad anytime from your
            dashboard.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-[var(--brand-green)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
