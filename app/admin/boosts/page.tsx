import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Plus } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { BoostRowActions } from '@/components/admin/BoostRowActions';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { formatLKR } from '@/lib/utils';

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function BoostsAdminPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { status } = await searchParams;
  const filterStatus = status ?? 'active';

  const supabase = createServiceClient();
  const { data: boosts } = await supabase
    .from('boosts')
    .select(
      `
      id, status, starts_at, expires_at, amount_paid, created_at,
      boost_plans ( name, type ),
      vehicles ( id, slug, model, year, vehicle_makes(name) )
    `,
    )
    .eq('status', filterStatus as any)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <AdminShell
      title="Boosts"
      subtitle={`${boosts?.length ?? 0} ${filterStatus}`}
      actions={
        <Link
          href="/admin/boosts/new"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
        >
          <Plus className="h-4 w-4" />
          Manual Boost
        </Link>
      }
    >
      <div className="mb-4 flex gap-2 border-b border-[var(--color-border)]">
        {['active', 'pending', 'expired', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={`/admin/boosts?status=${s}`}
            className={`px-3 py-2 text-sm capitalize ${
              filterStatus === s
                ? 'border-b-2 border-[var(--brand-green)] text-[var(--brand-deep)] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Vehicle</th>
                <th className="px-3 py-2 text-left font-medium">Plan</th>
                <th className="px-3 py-2 text-left font-medium">Amount</th>
                <th className="px-3 py-2 text-left font-medium">Starts</th>
                <th className="px-3 py-2 text-left font-medium">Expires</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(boosts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No boosts
                  </td>
                </tr>
              ) : (
                (boosts as any[]).map((b) => (
                  <tr key={b.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">
                      {b.vehicles ? (
                        <Link
                          href={`/vehicle/${b.vehicles.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {b.vehicles.year} {b.vehicles.vehicle_makes?.name} {b.vehicles.model}
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </Link>
                      ) : (
                        <span className="italic text-gray-400">Vehicle deleted</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                          b.boost_plans?.type === 'pro'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {b.boost_plans?.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{formatLKR(b.amount_paid)}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {b.starts_at ? new Date(b.starts_at).toLocaleDateString('en-LK') : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {b.expires_at ? new Date(b.expires_at).toLocaleDateString('en-LK') : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <BoostRowActions boostId={b.id} status={b.status} />
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