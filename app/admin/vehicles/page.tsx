import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, ExternalLink } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { VehicleRowActions } from '@/components/admin/VehicleRowActions';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { formatLKR, timeAgo } from '@/lib/utils';

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function VehiclesAdminPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { q, status } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from('vehicles')
    .select(`
      id, slug, model, year, price, status, view_count, created_at,
      vehicle_makes ( name ),
      districts ( name_en ),
      sellers ( phone, full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) query = query.ilike('model', `%${q}%`);
  if (status) query = query.eq('status', status as any);

  const { data: vehicles } = await query;

  return (
    <AdminShell title="Vehicles" subtitle={`${vehicles?.length ?? 0} shown`}>
      <form className="mb-4 flex gap-2 flex-wrap" action="/admin/vehicles">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by model..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--brand-green)]"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ''}
          className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
          <option value="hidden">Hidden</option>
        </select>
        <button type="submit" className="px-4 py-2 text-sm bg-[var(--brand-green)] text-white rounded-lg">
          Filter
        </button>
      </form>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Vehicle</th>
                <th className="text-left px-3 py-2 font-medium">Seller</th>
                <th className="text-left px-3 py-2 font-medium">Price</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Views</th>
                <th className="text-left px-3 py-2 font-medium">Posted</th>
                <th className="text-right px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(vehicles ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No vehicles</td>
                </tr>
              ) : (
                (vehicles as any[]).map((v) => (
                  <tr key={v.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">
                      <Link href={`/vehicle/${v.slug}`} target="_blank" className="hover:underline inline-flex items-center gap-1">
                        {v.year} {v.vehicle_makes?.name} {v.model}
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                      <p className="text-xs text-gray-400">{v.districts?.name_en}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-xs">{v.sellers?.full_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{v.sellers?.phone}</p>
                    </td>
                    <td className="px-3 py-2 font-medium">{formatLKR(v.price)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-3 py-2 text-xs">{v.view_count}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{timeAgo(v.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <VehicleRowActions vehicleId={v.id} status={v.status} />
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-600',
    sold: 'bg-gray-100 text-gray-600',
    hidden: 'bg-red-100 text-red-600',
    pending_review: 'bg-amber-100 text-amber-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${styles[status] ?? styles.active}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
