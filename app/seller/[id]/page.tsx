import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, MapPin, Calendar, Phone } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { createServiceClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: seller } = await supabase
    .from('sellers')
    .select('full_name, banned_at')
    .eq('id', id)
    .single();

  if (!seller || (seller as any).banned_at) return { title: 'Seller not found' };

  return {
    title: `${(seller as any).full_name} — Seller Profile`,
    description: `View all vehicle listings from ${(seller as any).full_name} on Siraa.lk.`,
    robots: { index: true, follow: true },
  };
}

export default async function SellerProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Look up seller
  const { data: seller } = await supabase
    .from('sellers')
    .select(`
      id, full_name, phone, created_at, verified_at, banned_at,
      districts ( name_en )
    `)
    .eq('id', id)
    .single();

  if (!seller || (seller as any).banned_at) notFound();
  const s = seller as any;

  // Active vehicles
  const { data: rawVehicles } = await supabase
    .from('vehicles')
    .select(`
      id, slug, model, year, price, mileage_km, fuel_type, transmission,
      condition, view_count, created_at,
      vehicle_makes ( name ),
      districts ( name_en ),
      cities ( name_en ),
      vehicle_images ( url, is_primary, sort_order ),
      boosts!boosts_vehicle_id_fkey ( status, boost_plans ( type ) )
    `)
    .eq('seller_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  // Also get sold count for stats
  const { count: soldCount } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', id)
    .eq('status', 'sold');

  const vehicles = (rawVehicles ?? []).map((row: any) => {
    const images = (row.vehicle_images ?? []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order,
    );
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
      condition: row.condition,
      primary_image: images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null,
      is_boosted: !!activeBoost,
      boost_type: activeBoost?.boost_plans?.type ?? null,
      price_dropped: false,
      created_at: row.created_at,
      view_count: row.view_count ?? 0,
    };
  });

  // Mask phone for privacy — only show last 3 digits
  const maskedPhone = s.phone
    ? s.phone.slice(0, -3).replace(/\d/g, '•') + s.phone.slice(-3)
    : '';

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-6">
        {/* Seller header */}
        <section className="mb-6 rounded-2xl bg-gradient-to-br from-[var(--brand-deep)] via-[var(--brand-green)] to-[var(--brand-mint)] p-6 text-white shadow-md">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-sm">
              {s.full_name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold md:text-2xl truncate">{s.full_name}</h1>
              {s.verified_at && (
                <div className="mt-1 flex items-center gap-1 text-xs text-white/85">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Phone verified
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/85">
                {s.districts?.name_en && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {s.districts.name_en}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Member since {timeAgo(s.created_at).replace('ago', '')}
                </span>
                {maskedPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {maskedPhone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
            <Stat label="Active" value={vehicles.length} />
            <Stat label="Sold" value={soldCount ?? 0} />
            <Stat label="Member" value={timeAgo(s.created_at).replace('ago', '').trim()} />
          </div>
        </section>

        {/* Listings */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Active Listings</h2>
            <span className="text-xs text-gray-500">{vehicles.length} {vehicles.length === 1 ? 'ad' : 'ads'}</span>
          </div>

          {vehicles.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-white py-12 text-center text-gray-400">
              <p className="mb-2">No active listings right now</p>
              <Link href="/search" className="text-sm text-[var(--brand-green)] hover:underline">
                Browse other vehicles →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-gray-400">
          Want to report this seller?{' '}
          <Link href="/contact" className="underline hover:text-[var(--brand-green)]">
            Contact us
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-white/70">{label}</p>
    </div>
  );
}
