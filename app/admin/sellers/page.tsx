import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, BadgeCheck } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { SellerRowActions } from '@/components/admin/SellerRowActions';
import { VerifiedBadge, getTrustTier } from '@/components/ui/VerifiedBadge';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  searchParams: Promise<{ q?: string; banned?: string; trusted?: string }>;
}

export default async function SellersPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { q, banned, trusted } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from('sellers')
    .select(
      'id, phone, full_name, banned_at, verified_at, trusted_at, created_at, free_posting_used',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  if (banned === '1') {
    query = query.not('banned_at', 'is', null);
  }
  if (trusted === '1') {
    query = query.not('trusted_at', 'is', null);
  }

  const { data: sellers } = await query;

  return (
    <AdminShell title="Sellers" subtitle={`${sellers?.length ?? 0} shown`}>
      {/* Filter bar */}
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/sellers">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search phone or name..."
            className="w-full rounded-lg border border-[var(--color-border)] py-2 pl-10 pr-3 text-sm outline-none focus:border-[var(--brand-green)]"
          />
        </div>
        <select
          name="banned"
          defaultValue={banned ?? ''}
          className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <option value="">All sellers</option>
          <option value="1">Banned only</option>
        </select>
        <select
          name="trusted"
          defaultValue={trusted ?? ''}
          className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <option value="">Any trust</option>
          <option value="1">Trusted only</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--brand-green)] px-4 py-2 text-sm text-white"
        >
          Filter
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Phone</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Trust</th>
                <th className="px-3 py-2 text-left font-medium">Joined</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(sellers ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No sellers found
                  </td>
                </tr>
              ) : (
                (sellers as any[]).map((s) => {
                  const tier = getTrustTier(s);
                  return (
                    <tr key={s.id} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2 font-mono text-xs">{s.phone}</td>
                      <td className="px-3 py-2">
                        <Link href={`/seller/${s.id}`} className="hover:underline">
                          {s.full_name}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <VerifiedBadge tier={tier} showLabel size="sm" />
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {new Date(s.created_at).toLocaleDateString('en-LK')}
                      </td>
                      <td className="px-3 py-2">
                        {s.banned_at ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                            Banned
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <SellerRowActions
                          sellerId={s.id}
                          isBanned={!!s.banned_at}
                          isTrusted={!!s.trusted_at}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
