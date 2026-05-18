import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { SellerRowActions } from '@/components/admin/SellerRowActions';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  searchParams: Promise<{ q?: string; banned?: string }>;
}

export default async function SellersPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { q, banned } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from('sellers')
    .select('id, phone, full_name, banned_at, verified_at, created_at, free_posting_used')
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  if (banned === '1') {
    query = query.not('banned_at', 'is', null);
  }

  const { data: sellers } = await query;

  return (
    <AdminShell title="Sellers" subtitle={`${sellers?.length ?? 0} shown`}>
      {/* Filter bar */}
      <form className="mb-4 flex gap-2 flex-wrap" action="/admin/sellers">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search phone or name..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--brand-green)]"
          />
        </div>
        <select
          name="banned"
          defaultValue={banned ?? ''}
          className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-2"
        >
          <option value="">All sellers</option>
          <option value="1">Banned only</option>
        </select>
        <button type="submit" className="px-4 py-2 text-sm bg-[var(--brand-green)] text-white rounded-lg">
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Phone</th>
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-left px-3 py-2 font-medium">Joined</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-right px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(sellers ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">No sellers found</td>
                </tr>
              ) : (
                (sellers as any[]).map((s) => (
                  <tr key={s.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2 font-mono text-xs">{s.phone}</td>
                    <td className="px-3 py-2">
                      <Link href={`/seller/${s.id}`} className="hover:underline">
                        {s.full_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleDateString('en-LK')}
                    </td>
                    <td className="px-3 py-2">
                      {s.banned_at ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Banned</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <SellerRowActions sellerId={s.id} isBanned={!!s.banned_at} />
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
