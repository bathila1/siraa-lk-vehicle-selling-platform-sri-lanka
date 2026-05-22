import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { BoostPicker } from '@/components/boost/BoostPicker';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { formatLKR } from '@/lib/utils';
import { PendingBoostActions } from '@/components/boost/PendingBoostActions';

export const metadata: Metadata = { title: 'Boost Your Ad' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BoostPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard');

  const { id } = await params;
  const vehicleId = parseInt(id);
  if (isNaN(vehicleId)) notFound();

  const supabase = createServiceClient();

  const [{ data: vehicle }, { data: plans }, { data: activeBoost }] = await Promise.all([
    supabase
      .from('vehicles')
      .select(
        `
        id, slug, model, year, price, status, seller_id,
        vehicle_makes ( name ),
        vehicle_images ( url, is_primary, sort_order )
      `,
      )
      .eq('id', vehicleId)
      .single(),
    supabase
      .from('boost_plans')
      .select('id, name, type, price, duration_days, description')
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('boosts')
      .select('id, status, expires_at, boost_plans(name, type)')
      .eq('vehicle_id', vehicleId)
      .in('status', ['active', 'pending'])
      .maybeSingle(),
  ]);

  if (!vehicle || vehicle.seller_id !== session.seller_id) notFound();

  const v = vehicle as any;
  const images = (v.vehicle_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const primaryImage = images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-3.5rem)] bg-[var(--brand-bg)]">
        <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">
          <Link
            href="/dashboard"
            className="mb-3 flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--brand-green)]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to dashboard
          </Link>

          <h1 className="mb-1 text-xl font-bold">Boost your ad</h1>
          <p className="mb-5 text-sm text-gray-500">
            Get more views by featuring your listing at the top of search results.
          </p>

          {/* Vehicle preview */}
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
            {primaryImage && (
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={primaryImage}
                  alt={v.model}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {v.year} {v.vehicle_makes?.name} {v.model}
              </p>
              <p className="mt-0.5 text-sm font-bold text-[var(--brand-deep)]">
                {formatLKR(v.price)}
              </p>
            </div>
          </div>

          {activeBoost?.status === 'active' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
              <p className="font-medium text-amber-800">
                This vehicle is currently boosted as {(activeBoost as any).boost_plans?.name}.
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Expires {new Date(activeBoost.expires_at).toLocaleDateString('en-LK', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          ) : activeBoost?.status === 'pending' ? (
            <PendingBoostActions boost={activeBoost} vehicleId={v.id} />
          ) : (
            <BoostPicker vehicleId={v.id} plans={plans ?? []} />
          )}
        </div>
      </main>
    </>
  );
}
