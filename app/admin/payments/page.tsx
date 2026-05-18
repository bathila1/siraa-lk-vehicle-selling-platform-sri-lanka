import { redirect } from 'next/navigation';
import Link from 'next/link';

import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { formatLKR } from '@/lib/utils';

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function PaymentsAdminPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { status } = await searchParams;
  const filterStatus = status ?? 'completed';

  const supabase = createServiceClient();
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id, gateway_order_id, gateway_payment_id, amount, currency, status,
      created_at, completed_at,
      sellers ( phone, full_name )
    `)
    .eq('status', filterStatus as any)
    .order('created_at', { ascending: false })
    .limit(100);

  const total = (payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);

  return (
    <AdminShell
      title="Payments"
      subtitle={`${payments?.length ?? 0} ${filterStatus} · Total: ${formatLKR(total)}`}
    >
      <div className="flex gap-2 mb-4 border-b border-[var(--color-border)]">
        {['completed', 'pending', 'failed', 'cancelled', 'refunded'].map((s) => (
          <Link
            key={s}
            href={`/admin/payments?status=${s}`}
            className={`text-sm px-3 py-2 capitalize ${
              filterStatus === s
                ? 'border-b-2 border-[var(--brand-green)] text-[var(--brand-deep)] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Order ID</th>
                <th className="text-left px-3 py-2 font-medium">Seller</th>
                <th className="text-left px-3 py-2 font-medium">Amount</th>
                <th className="text-left px-3 py-2 font-medium">Created</th>
                <th className="text-left px-3 py-2 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No payments</td></tr>
              ) : (
                (payments as any[]).map((p) => (
                  <tr key={p.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 font-mono text-xs">{p.gateway_order_id}</td>
                    <td className="px-3 py-2">
                      <p className="text-xs">{p.sellers?.full_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sellers?.phone}</p>
                    </td>
                    <td className="px-3 py-2 font-medium">{formatLKR(p.amount)}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleString('en-LK')}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {p.completed_at ? new Date(p.completed_at).toLocaleString('en-LK') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
