import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { PaymentReturnClient } from '@/components/boost/PaymentReturnClient';

export const metadata: Metadata = { title: 'Payment Processing' };

interface Props {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function PaymentReturnPage({ searchParams }: Props) {
  const { order_id } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center bg-[var(--brand-bg)] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <PaymentReturnClient orderId={order_id ?? null} />
        </div>
      </main>
    </>
  );
}
