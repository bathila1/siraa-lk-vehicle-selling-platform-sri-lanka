import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Plus, CheckCircle2, Zap, TrendingUp, Eye, Phone, Clock } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Badge } from '@/components/ui/Badge';
import { DashboardActions } from '@/components/auth/DashboardActions';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { formatLKR, timeAgo, cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { CelebrationConfetti } from '@/components/shared/CelebrationConfetti';

export const metadata: Metadata = { title: 'My Dashboard' };

interface Props {
  searchParams: Promise<{ posted?: string; registered?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');

  const { posted, registered } = await searchParams;

  const supabase = createServiceClient();

  // Pull vehicles + active boosts + plan type in one query
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year, price, status, view_count, contact_reveal_count,
      created_at, sold_at,
      vehicle_makes ( name ),
      districts ( name_en ),
      vehicle_images ( url, is_primary, sort_order ),
      boosts!boosts_vehicle_id_fkey ( status, expires_at, boost_plans ( type, name ) )
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

  // Pre-compute boost states + sort: Pro → Normal → Regular
  const enriched = (vehicles ?? []).map((v: any) => {
    const activeBoost = (v.boosts ?? []).find((b: any) => b.status === 'active');
    return {
      ...v,
      boostType: activeBoost?.boost_plans?.type ?? null,
      boostExpiresAt: activeBoost?.expires_at ?? null,
    };
  });
  enriched.sort((a, b) => {
    const rank = (t: string | null) => (t === 'pro' ? 0 : t === 'normal' ? 1 : 2);
    return rank(a.boostType) - rank(b.boostType);
  });

  const proCount = enriched.filter((v) => v.boostType === 'pro').length;
  const normalCount = enriched.filter((v) => v.boostType === 'normal').length;

  return (
    <>
      <CelebrationConfetti trigger={posted} />
      <CelebrationConfetti trigger={registered} />

      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">My Dashboard</h1>
            <p className="text-sm text-gray-500">
              {seller?.phone} · {enriched.length} active ad{enriched.length === 1 ? '' : 's'}
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
          {enriched.length === 0 ? null : (
            <Link
              href="/post-ad"
              className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
            >
              <Plus className="h-4 w-4" />
              Post New Ad
            </Link>
          )}
        </div>

        {/* Boost stats banner (only if any boosts active) */}
        {(proCount > 0 || normalCount > 0) && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-3">
            <Zap className="h-5 w-5 flex-shrink-0 fill-amber-200 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-amber-900">
                {proCount > 0 && (
                  <>
                    <strong>{proCount}</strong> Pro boost{proCount === 1 ? '' : 's'}
                  </>
                )}
                {proCount > 0 && normalCount > 0 && ' · '}
                {normalCount > 0 && (
                  <>
                    <strong>{normalCount}</strong> Normal boost{normalCount === 1 ? '' : 's'}
                  </>
                )}{' '}
                active
              </p>
              <p className="text-xs text-amber-700">
                Your boosted ads appear at the top of search results.
              </p>
            </div>
          </div>
        )}

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

        {enriched.length === 0 ? (
          <EmptyState
            icon="🚗"
            title="You haven't posted any ads yet."
            description="It only takes 2 minutes to post your vehicle."
            actionLabel="Post Your First Ad"
            actionHref="/post-ad"
          />
        ) : (
          <div className="space-y-3">
            {enriched.map((v: any) => (
              <DashboardVehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

// =============================================================================
// Card variants by boost status
// =============================================================================

function DashboardVehicleCard({ vehicle: v }: { vehicle: any }) {
  const images = (v.vehicle_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const img = images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null;
  const isPro = v.boostType === 'pro';
  const isNormal = v.boostType === 'normal';
  const isBoosted = isPro || isNormal;

  // Pro card — full premium gradient border + shimmer
  if (isPro) {
    return (
      <div className="group relative overflow-hidden rounded-xl shadow-md transition-shadow hover:shadow-xl">
        {/* Animated gradient border */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500"
        />
        {/* Inner content */}
        <div className="relative m-[2px] rounded-[10px] bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30">
          <ProRibbon expiresAt={v.boostExpiresAt} />
          <CardBody vehicle={v} img={img} />
        </div>
        {/* Shimmer sweep */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
        />
      </div>
    );
  }

  // Normal boost — subtle accent
  if (isNormal) {
    return (
      <div className="relative overflow-hidden rounded-xl border-2 border-amber-300 bg-gradient-to-br from-white to-amber-50/40 shadow-sm">
        <NormalRibbon expiresAt={v.boostExpiresAt} />
        <CardBody vehicle={v} img={img} />
      </div>
    );
  }

  // Regular card
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white">
      <CardBody vehicle={v} img={img} />
    </div>
  );
}

function CardBody({ vehicle: v, img }: { vehicle: any; img: string | null }) {
  const isBoosted = v.boostType === 'pro' || v.boostType === 'normal';
  return (
    <div className="flex items-stretch gap-3 p-3">
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
            className="line-clamp-1 text-sm font-semibold hover:text-[var(--brand-green)]"
          >
            {v.year} {v.vehicle_makes?.name} {v.model}
          </Link>
          {v.status === 'sold' && <Badge>Sold</Badge>}
        </div>
        <p
          className={cn(
            'text-sm font-bold',
            v.boostType === 'pro'
              ? 'bg-gradient-to-r from-[var(--brand-deep)] to-[var(--brand-green)] bg-clip-text text-transparent'
              : 'text-[var(--brand-deep)]',
          )}
        >
          {formatLKR(v.price)}
        </p>
        <p className="text-xs text-gray-500">{v.districts?.name_en}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {v.view_count}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {v.contact_reveal_count}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(v.created_at)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0">
        <DashboardActions
          isBoosted={isBoosted}
          vehicleId={v.id}
          vehicleSlug={v.slug}
          isSold={v.status === 'sold'}
        />
      </div>
    </div>
  );
}

function ProRibbon({ expiresAt }: { expiresAt: string | null }) {
  const days = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="flex items-center justify-between border-b border-amber-200/60 bg-gradient-to-r from-amber-500/95 to-orange-500/95 px-3 py-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
        <Zap className="h-3 w-3 fill-white" />
        Pro Boost Active
      </span>
      {days !== null && (
        <span className="text-[10px] font-medium text-white/90">
          {days === 0 ? 'Expires today' : `${days} day${days === 1 ? '' : 's'} left`}
        </span>
      )}
    </div>
  );
}

function NormalRibbon({ expiresAt }: { expiresAt: string | null }) {
  const days = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-3 py-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
        <TrendingUp className="h-3 w-3" />
        Boosted
      </span>
      {days !== null && (
        <span className="text-[10px] font-medium text-amber-700">
          {days === 0 ? 'Expires today' : `${days} day${days === 1 ? '' : 's'} left`}
        </span>
      )}
    </div>
  );
}
