import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

export default async function AuditLogPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();
  const { data: logs } = await supabase
    .from('audit_log')
    .select('id, action, target_type, target_id, details, ip_address, created_at, admin_users(full_name, phone)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <AdminShell title="Audit Log" subtitle="Every admin action is recorded here.">
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">When</th>
                <th className="text-left px-3 py-2 font-medium">Admin</th>
                <th className="text-left px-3 py-2 font-medium">Action</th>
                <th className="text-left px-3 py-2 font-medium">Target</th>
                <th className="text-left px-3 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No log entries yet</td></tr>
              ) : (
                (logs as any[]).map((l) => (
                  <tr key={l.id} className="border-t border-[var(--color-border)] align-top">
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                      {timeAgo(l.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-xs">{l.admin_users?.full_name ?? 'System'}</p>
                      <p className="text-xs text-gray-400 font-mono">{l.admin_users?.phone}</p>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{l.action}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {l.target_type ? `${l.target_type} #${l.target_id}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-xs">
                      {l.details ? (
                        <pre className="font-mono text-[10px] whitespace-pre-wrap break-all">
                          {JSON.stringify(l.details, null, 0).slice(0, 100)}
                        </pre>
                      ) : '—'}
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
