import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ code: string }>;
}

export const metadata: Metadata = { title: 'Shared Vehicle List' };

export default async function SharedListPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: list } = await supabase
    .from('saved_lists')
    .select('vehicle_ids, expires_at')
    .eq('share_code', code)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!list || !list.vehicle_ids?.length) notFound();

  // Increment view count
  // await supabase.rpc('increment_saved_list_views' as any, { p_code: code }).catch(() => {});

  // Fetch the vehicles
  const { data: rawVehicles } = await supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year, price, mileage_km, fuel_type, transmission, created_at, view_count,
      vehicle_makes ( name ),
      districts ( name_en ),
      cities ( name_en ),
      vehicle_images ( url, is_primary, sort_order ),
      boosts ( status, boost_plans ( type ) )
    `,
    )
    .in('id', list.vehicle_ids)
    .eq('status', 'active');

  const vehicles = (rawVehicles ?? []).map((row: any) => {
    const images = (row.vehicle_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
    const activeBoost = (row.boosts ?? []).find((b: any) => b.status === 'active');
    return {
      id: row.id,
      slug: row.slug,
      make_name: row.vehicle_makes?.name ?? '',
      model: row.model,
      year: row.year,
      price: row.price,
      mileage_km: row.mileage_km,
      fuel_type: row.fuel_type,
      transmission: row.transmission,
      district_name: row.districts?.name_en ?? '',
      city_name: row.cities?.name_en ?? null,
      condition: 'registered',
      primary_image: images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null,
      is_boosted: !!activeBoost,
      boost_type: activeBoost?.boost_plans?.type ?? null,
      price_dropped: false,
      created_at: row.created_at,
      view_count: row.view_count ?? 0,
    };
  });

  const expiresDate = new Date(list.expires_at).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-1 text-xl font-bold">Shared Vehicle List</h1>
          <p className="text-sm text-gray-500">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} · expires {expiresDate}
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p>All vehicles in this list are no longer available.</p>
            <Link
              href="/search"
              className="mt-2 inline-block text-sm text-[var(--brand-green)] hover:underline"
            >
              Browse current listings →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
