/**
 * Database query helpers.
 * Clean, typed wrappers around Supabase calls used across pages.
 * All use the server client (SSR-safe, cookie-based auth).
 */

import { createClient } from '@/lib/supabase/server';

// ---------- Reference data (cached, changes rarely) ----------

export async function getVehicleTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('vehicle_types')
    .select('id, name_en, name_si, slug, icon')
    .eq('active', true)
    .order('sort_order');
  return data ?? [];
}

export async function getDistricts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('districts')
    .select('id, name_en, name_si, slug')
    .order('sort_order');
  return data ?? [];
}

export async function getCitiesByDistrict(districtId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cities')
    .select('id, name_en, name_si, slug')
    .eq('district_id', districtId)
    .order('sort_order');
  return data ?? [];
}

export async function getVehicleMakesByType(typeId?: number) {
  const supabase = await createClient();
  let query = supabase
    .from('vehicle_makes')
    .select('id, name, slug, type_ids')
    .eq('active', true)
    .order('name');
  // Note: filtering by type_ids array requires a contains check
  if (typeId) {
    query = query.contains('type_ids', [typeId]);
  }
  const { data } = await query;
  return data ?? [];
}

export async function getBoostPlans() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('boost_plans')
    .select('id, name, type, price, duration_days, description')
    .eq('active', true)
    .order('sort_order');
  return data ?? [];
}

// ---------- Homepage ----------

export async function getHomepageData() {
  const supabase = await createClient();

  // Run all three queries in parallel — not sequentially
  const [latestResult, boostedResult, promoResult] = await Promise.all([
    // Latest active vehicles
    supabase
      .from('vehicles')
      .select(
        `
        id, slug, model, year, price, mileage_km, fuel_type, created_at, view_count,
        vehicle_makes ( name ),
        districts ( name_en ),
        cities ( name_en ),
        vehicle_images ( url, is_primary, sort_order )
      `,
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(24),

    // Active BoostPro vehicles — join via vehicle_id, filter by plan type separately
    supabase
      .from('vehicles')
      .select(
        `
        id, slug, model, year, price,
        vehicle_makes ( name ),
        districts ( name_en ),
        vehicle_images ( url, is_primary, sort_order ),
        boosts!inner ( status, boost_plans!inner ( type ) )
      `,
      )
      .eq('status', 'active')
      .eq('boosts.status', 'active')
      .eq('boosts.boost_plans.type', 'pro')
      .limit(6),

    // Promo settings
    supabase.from('site_settings').select('value').eq('key', 'promo_first_100_sellers').single(),
  ]);

  return {
    latest: latestResult.data ?? [],
    boosted: boostedResult.data ?? [],
    promo: (promoResult.data as any)?.value ?? null,
  };
}

// ---------- Vehicle detail ----------

export interface VehicleDetail {
  id: number;
  slug: string;
  model: string;
  year: number;
  price: number;
  mileage_km: number | null;
  engine_cc: number | null;
  body_type: string | null;
  fuel_type: string | null;
  transmission: string | null;
  condition: string;
  color: string | null;
  previous_owners: number | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  view_count: number;
  contact_reveal_count: number;
  custom_attributes: Record<string, unknown>;
  created_at: string;
  vehicle_type: { id: number; name_en: string; slug: string } | null;
  make: { id: number; name: string } | null;
  district: { id: number; name_en: string } | null;
  city: { id: number; name_en: string } | null;
  images: {
    url: string;
    is_primary: boolean;
    sort_order: number;
    width: number | null;
    height: number | null;
  }[];
  seller: {
    id: string;
    full_name: string;
    phone: string;
    whatsapp_number: string | null;
    district: { name_en: string } | null;
  } | null;
  is_boosted: boolean;
  boost_type: string | null;
  price_history: { old_price: number; new_price: number; changed_at: string }[];
}

export async function getVehicleBySlug(slug: string): Promise<VehicleDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year, price, mileage_km, engine_cc, body_type,
      fuel_type, transmission, condition, color, previous_owners,
      description, lat, lng, status, view_count, contact_reveal_count,
      custom_attributes, created_at,
      vehicle_types ( id, name_en, slug ),
      vehicle_makes ( id, name ),
      districts ( id, name_en ),
      cities ( id, name_en ),
      vehicle_images ( url, is_primary, sort_order, width, height ),
      sellers (
        id, full_name, phone, whatsapp_number,
        districts ( name_en )
      ),
      boosts ( status, boost_plans ( type ) ),
      price_history ( old_price, new_price, changed_at )
    `,
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !data) return null;

  const d = data as any;
  const images = (d.vehicle_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const activeBoost = (d.boosts ?? []).find((b: any) => b.status === 'active');

  return {
    id: d.id,
    slug: d.slug,
    model: d.model,
    year: d.year,
    price: d.price,
    mileage_km: d.mileage_km,
    engine_cc: d.engine_cc,
    body_type: d.body_type,
    fuel_type: d.fuel_type,
    transmission: d.transmission,
    condition: d.condition,
    color: d.color,
    previous_owners: d.previous_owners,
    description: d.description,
    lat: d.lat,
    lng: d.lng,
    status: d.status,
    view_count: d.view_count,
    contact_reveal_count: d.contact_reveal_count,
    custom_attributes: d.custom_attributes ?? {},
    created_at: d.created_at,
    vehicle_type: d.vehicle_types ?? null,
    make: d.vehicle_makes ?? null,
    district: d.districts ?? null,
    city: d.cities ?? null,
    images,
    seller: d.sellers ?? null,
    is_boosted: !!activeBoost,
    boost_type: activeBoost?.boost_plans?.type ?? null,
    price_history: (d.price_history ?? []).sort(
      (a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
    ),
  };
}

/** Similar vehicles — same type + make, excluding current */
export async function getSimilarVehicles(
  vehicleId: number,
  typeId: number,
  makeId: number,
  limit = 6,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year, price,
      vehicle_makes ( name ),
      districts ( name_en ),
      vehicle_images ( url, is_primary, sort_order )
    `,
    )
    .eq('status', 'active')
    .eq('vehicle_type_id', typeId)
    .eq('make_id', makeId)
    .neq('id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Popular searches from log */
export async function getPopularSearches(limit = 6): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('searches_log')
    .select('normalized')
    .not('normalized', 'is', null)
    .gte('created_at', new Date(Date.now() - 7 * 86400_000).toISOString())
    .limit(200);

  if (!data) return [];

  // Count and sort client-side (avoids GROUP BY complexity)
  const counts: Record<string, number> = {};
  for (const row of data as any[]) {
    const key = (row as any).normalized as string;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([q]) => q);
}
