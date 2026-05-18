import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, AlertCircle } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { ReportRowActions } from '@/components/admin/ReportRowActions';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { status } = await searchParams;
  const filterStatus = status ?? 'pending';

  const supabase = createServiceClient();
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id, reason, notes, reporter_phone, reporter_name, status, admin_notes,
      created_at, resolved_at,
      vehicles ( id, slug, model, year, status, vehicle_makes(name), sellers(phone, full_name) )
    `)
    .eq('status', filterStatus as any)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <AdminShell
      title="Reports"
      subtitle={`${reports?.length ?? 0} ${filterStatus} report${reports?.length === 1 ? '' : 's'}`}
    >
      {/* Status tabs */}
      <div className="flex gap-2 mb-4 border-b border-[var(--color-border)]">
        {['pending', 'investigating', 'resolved', 'dismissed'].map((s) => (
          <Link
            key={s}
            href={`/admin/reports?status=${s}`}
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

      {(reports ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No {filterStatus} reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(reports as any[]).map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  {r.vehicles ? (
                    <Link
                      href={`/vehicle/${r.vehicles.slug}`}
                      target="_blank"
                      className="font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      {r.vehicles.year} {r.vehicles.vehicle_makes?.name} {r.vehicles.model}
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </Link>
                  ) : (
                    <span className="text-gray-400 italic">Vehicle deleted</span>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Reason: <span className="font-medium capitalize">{r.reason.replace(/_/g, ' ')}</span>
                    {' · '}
                    {timeAgo(r.created_at)}
                  </p>
                  {r.vehicles?.sellers && (
                    <p className="text-xs text-gray-400">
                      Seller: {r.vehicles.sellers.full_name} ({r.vehicles.sellers.phone})
                    </p>
                  )}
                </div>
                {r.vehicles && r.status === 'pending' && (
                  <ReportRowActions
                    reportId={r.id}
                    vehicleId={r.vehicles.id}
                  />
                )}
              </div>

              {r.notes && (
                <div className="bg-[var(--brand-bg)] rounded-lg p-3 text-sm text-gray-700 mb-2">
                  <p className="text-xs text-gray-500 mb-1">Reporter notes:</p>
                  {r.notes}
                </div>
              )}

              {r.reporter_phone && (
                <p className="text-xs text-gray-400">
                  Contact: {r.reporter_name ?? 'Anonymous'} · {r.reporter_phone}
                </p>
              )}

              {r.admin_notes && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-xs text-gray-500">
                  <strong>Admin notes:</strong> {r.admin_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
