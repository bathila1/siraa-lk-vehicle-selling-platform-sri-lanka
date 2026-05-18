import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Car, Users, AlertTriangle, Zap, TrendingUp, MessageSquare } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { formatLKR } from '@/lib/utils';
import { fetchSmsCreditBalance } from '@/lib/smslenz';

export default async function AdminHome() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();

  // Use Promise.all for parallel fetching
  const [
    activeVehiclesRes,
    soldVehiclesRes,
    sellersRes,
    pendingReportsRes,
    activeBoostsRes,
    revenueRes,
    recentReportsRes,
    smsBalance,
  ] = await Promise.all([
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('sellers').select('id', { count: 'exact', head: true }),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('boosts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('amount').eq('status', 'completed'),
    supabase.from('reports')
      .select(`id, reason, created_at, vehicles ( slug, model, year, vehicle_makes(name) )`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    fetchSmsCreditBalance().catch(() => null),
  ]);

  const totalRevenue = (revenueRes.data ?? []).reduce(
    (sum: number, r: any) => sum + Number(r.amount ?? 0),
    0,
  );

  const stats = [
    { label: 'Active vehicles', value: activeVehiclesRes.count ?? 0, icon: Car, href: '/admin/vehicles' },
    { label: 'Sold vehicles', value: soldVehiclesRes.count ?? 0, icon: Car, href: '/admin/vehicles?status=sold' },
    { label: 'Sellers', value: sellersRes.count ?? 0, icon: Users, href: '/admin/sellers' },
    { label: 'Pending reports', value: pendingReportsRes.count ?? 0, icon: AlertTriangle, href: '/admin/reports', highlight: (pendingReportsRes.count ?? 0) > 0 },
    { label: 'Active boosts', value: activeBoostsRes.count ?? 0, icon: Zap, href: '/admin/boosts' },
    { label: 'Total revenue', value: formatLKR(totalRevenue), icon: TrendingUp, href: '/admin/payments' },
  ];

  return (
    <AdminShell title={`Hi, ${session.phone}`} subtitle="Welcome to the Siraa admin panel.">
      {/* SMS balance warning */}
      {smsBalance !== null && (
        <div className="mb-4 bg-white border border-[var(--color-border)] rounded-xl p-3 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-[var(--brand-green)]" />
          <span className="text-gray-600">SMSLenz credit balance:</span>
          <span className="font-semibold">{smsBalance}</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className={`bg-white rounded-xl p-4 border transition-colors ${
                s.highlight
                  ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                  : 'border-[var(--color-border)] hover:border-[var(--brand-green)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.highlight ? 'text-amber-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-xl font-bold mt-1 ${s.highlight ? 'text-amber-700' : 'text-[var(--brand-deep)]'}`}>
                {s.value}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Recent reports */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Recent pending reports</h2>
          <Link href="/admin/reports" className="text-xs text-[var(--brand-green)] hover:underline">
            View all →
          </Link>
        </div>
        {(recentReportsRes.data ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No pending reports 🎉</p>
        ) : (
          <ul className="space-y-2">
            {(recentReportsRes.data as any[]).map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm border-b border-[var(--color-border)] last:border-0 pb-2 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {r.vehicles?.vehicle_makes?.name} {r.vehicles?.model} {r.vehicles?.year}
                  </p>
                  <p className="text-xs text-gray-400">
                    Reason: <span className="capitalize">{r.reason.replace(/_/g, ' ')}</span>
                  </p>
                </div>
                <Link
                  href={`/admin/reports`}
                  className="text-xs text-[var(--brand-green)] hover:underline ml-2 flex-shrink-0"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
