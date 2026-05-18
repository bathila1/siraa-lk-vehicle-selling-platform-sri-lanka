import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Plus, CheckCircle2 } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Badge } from '@/components/ui/Badge';
import { DashboardActions } from '@/components/auth/DashboardActions';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { formatLKR, timeAgo } from '@/lib/utils';

export const metadata: Metadata = { title: 'My Dashboard' };

interface Props {
  searchParams: Promise<{ posted?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');

  const { posted } = await searchParams;

  const supabase = createServiceClient();
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year, price, status, view_count, contact_reveal_count,
      created_at, sold_at,
      vehicle_makes ( name ),
      districts ( name_en ),
      vehicle_images ( url, is_primary, sort_order )
    `,
    )
    .eq('seller_id', session.seller_id)
    .neq('status', 'hidden')
    .order('created_at', { ascending: false });

  const { data: seller } = await supabase
    .from('sellers')
    .select('full_name, phone')
    .eq('id', session.seller_id)
    .single();

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">My Dashboard</h1>
            <p className="text-sm text-gray-500">
              {seller?.phone} · {vehicles?.length ?? 0} active ad{vehicles?.length === 1 ? '' : 's'}
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="text-xs text-[var(--brand-green)] hover:underline"
              >
                Edit profile
              </Link>
              <LogoutButton />
            </div>
          </div>
          <Link
            href="/post-ad"
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
          >
            <Plus className="h-4 w-4" />
            Post New Ad
          </Link>
        </div>

        {posted && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--brand-mint)] bg-[var(--brand-bg)] p-4">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[var(--brand-green)]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--brand-deep)]">Ad published!</p>
              <p className="text-xs text-gray-600">Your listing is now live.</p>
            </div>
            <Link
              href={`/vehicle/${posted}`}
              className="text-xs font-medium text-[var(--brand-green)] hover:underline"
            >
              View →
            </Link>
          </div>
        )}

        {!vehicles || vehicles.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl opacity-30">🚗</div>
            <p className="mb-2 text-gray-500">You haven&apos;t posted any ads yet</p>
            <p className="mb-6 text-sm text-gray-400">
              It only takes 2 minutes to list your vehicle
            </p>
            <Link
              href="/post-ad"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
            >
              <Plus className="h-4 w-4" />
              Post Your First Ad
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((v: any) => {
              const images = (v.vehicle_images ?? []).sort(
                (a: any, b: any) => a.sort_order - b.sort_order,
              );
              const img = images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null;
              return (
                <div
                  key={v.id}
                  className="flex items-stretch gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/vehicle/${v.slug}`}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24"
                  >
                    {img ? (
                      <Image src={img} alt={v.model} fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">
                        No photo
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/vehicle/${v.slug}`}
                        className="line-clamp-1 text-sm font-medium hover:text-[var(--brand-green)]"
                      >
                        {v.year} {v.vehicle_makes?.name} {v.model}
                      </Link>
                      {v.status === 'sold' && <Badge>Sold</Badge>}
                    </div>
                    <p className="text-sm font-bold text-[var(--brand-deep)]">
                      {formatLKR(v.price)}
                    </p>
                    <p className="text-xs text-gray-500">{v.districts?.name_en}</p>
                    <div className="mt-auto flex items-center gap-3 text-xs text-gray-400">
                      <span>👁️ {v.view_count} views</span>
                      <span>📞 {v.contact_reveal_count} reveals</span>
                      <span>· {timeAgo(v.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    <DashboardActions
                      vehicleId={v.id}
                      vehicleSlug={v.slug}
                      isSold={v.status === 'sold'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
