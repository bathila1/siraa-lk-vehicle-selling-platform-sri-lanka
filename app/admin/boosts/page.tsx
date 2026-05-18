import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
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
    .select(`
      id, status, starts_at, expires_at, amount_paid, created_at,
      boost_plans ( name, type ),
      vehicles ( id, slug, model, year, vehicle_makes(name) )
    `)
    .eq('status', filterStatus as any)
    .order('expires_at', { ascending: filterStatus === 'active' })
    .limit(100);

  return (
    <AdminShell title="Boosts" subtitle={`${boosts?.length ?? 0} ${filterStatus}`}>
      <div className="flex gap-2 mb-4 border-b border-[var(--color-border)]">
        {['active', 'pending', 'expired', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={`/admin/boosts?status=${s}`}
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
                <th className="text-left px-3 py-2 font-medium">Vehicle</th>
                <th className="text-left px-3 py-2 font-medium">Plan</th>
                <th className="text-left px-3 py-2 font-medium">Amount</th>
                <th className="text-left px-3 py-2 font-medium">Starts</th>
                <th className="text-left px-3 py-2 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {(boosts ?? []).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No boosts</td></tr>
              ) : (
                (boosts as any[]).map((b) => (
                  <tr key={b.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">
                      {b.vehicles ? (
                        <Link href={`/vehicle/${b.vehicles.slug}`} target="_blank" className="hover:underline inline-flex items-center gap-1">
                          {b.vehicles.year} {b.vehicles.vehicle_makes?.name} {b.vehicles.model}
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Link>
                      ) : <span className="text-gray-400 italic">Vehicle deleted</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        b.boost_plans?.type === 'pro'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {b.boost_plans?.name}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{formatLKR(b.amount_paid)}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(b.starts_at).toLocaleDateString('en-LK')}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(b.expires_at).toLocaleDateString('en-LK')}
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
