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
    .select(`
      id, slug, model, year, price, status, view_count, contact_reveal_count,
      created_at, sold_at,
      vehicle_makes ( name ),
      districts ( name_en ),
      vehicle_images ( url, is_primary, sort_order )
    `)
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
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">My Dashboard</h1>
            <p className="text-sm text-gray-500">
              {seller?.phone} · {vehicles?.length ?? 0} active ad{vehicles?.length === 1 ? '' : 's'}
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              <Link href="/dashboard/profile" className="text-xs text-[var(--brand-green)] hover:underline">
                Edit profile
              </Link>
              <LogoutButton />
            </div>
          </div>
          <Link
            href="/post-ad"
            className="bg-[var(--brand-green)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--brand-deep)] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Post New Ad
          </Link>
        </div>

        {posted && (
          <div className="bg-[var(--brand-bg)] border border-[var(--brand-mint)] rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--brand-green)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--brand-deep)]">Ad published!</p>
              <p className="text-xs text-gray-600">Your listing is now live.</p>
            </div>
            <Link
              href={`/vehicle/${posted}`}
              className="text-xs text-[var(--brand-green)] hover:underline font-medium"
            >
              View →
            </Link>
          </div>
        )}

        {!vehicles || vehicles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">🚗</div>
            <p className="text-gray-500 mb-2">You haven&apos;t posted any ads yet</p>
            <p className="text-sm text-gray-400 mb-6">It only takes 2 minutes to list your vehicle</p>
            <Link
              href="/post-ad"
              className="inline-flex items-center gap-1.5 bg-[var(--brand-green)] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[var(--brand-deep)]"
            >
              <Plus className="w-4 h-4" />
              Post Your First Ad
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((v: any) => {
              const images = (v.vehicle_images ?? []).sort(
                (a: any, b: any) => a.sort_order - b.sort_order,
              );
              const img =
                images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null;
              return (
                <div
                  key={v.id}
                  className="bg-white border border-[var(--color-border)] rounded-xl p-3 flex items-stretch gap-3"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/vehicle/${v.slug}`}
                    className="flex-shrink-0 relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={v.model}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        No photo
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/vehicle/${v.slug}`}
                        className="font-medium text-sm hover:text-[var(--brand-green)] line-clamp-1"
                      >
                        {v.year} {v.vehicle_makes?.name} {v.model}
                      </Link>
                      {v.status === 'sold' && <Badge>Sold</Badge>}
                    </div>
                    <p className="text-[var(--brand-deep)] font-bold text-sm">
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
