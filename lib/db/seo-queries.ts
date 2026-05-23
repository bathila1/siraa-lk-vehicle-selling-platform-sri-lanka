import { createServiceClient } from '@/lib/supabase/server';

/**
 * SEO landing page query helpers.
 * Cached at the page level via Next.js `revalidate`.
 */

export interface CategoryStats {
  total: number;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  popularModels: { model: string; count: number }[];
  yearRange: { min: number; max: number } | null;
}

/**
 * Get all active vehicle types with counts. Used for /categories index page.
 */
export async function getVehicleTypesWithCounts() {
  const supabase = createServiceClient();
  const { data: types } = await supabase
    .from('vehicle_types')
    .select('id, name_en, name_si, slug, sort_order')
    .eq('active', true)
    .order('sort_order');

  if (!types) return [];

  // Get counts per type in one batched query
  const { data: counts } = await supabase
    .from('vehicles')
    .select('vehicle_type_id', { count: 'exact', head: false })
    .eq('status', 'active');

  const countMap = new Map<number, number>();
  (counts ?? []).forEach((row: any) => {
    countMap.set(row.vehicle_type_id, (countMap.get(row.vehicle_type_id) ?? 0) + 1);
  });

  return (types as any[]).map((t) => ({
    ...t,
    count: countMap.get(t.id) ?? 0,
  }));
}

/**
 * Get a vehicle type by slug.
 */
export async function getVehicleTypeBySlug(slug: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('vehicle_types')
    .select('id, name_en, name_si, slug')
    .eq('slug', slug)
    .eq('active', true)
    .single();
  return data as any;
}

/**
 * Get a make by slug, optionally constrained to a vehicle type.
 */
export async function getMakeBySlug(slug: string, typeId?: number) {
  const supabase = createServiceClient();
  let q = supabase
    .from('vehicle_makes')
    .select('id, name, slug, type_ids')
    .eq('slug', slug)
    .eq('active', true);
  const { data } = await q.single();

  if (!data) return null;
  // If a type is required, ensure this make applies to it
  if (typeId && !(data as any).type_ids?.includes(typeId)) return null;

  return data as any;
}

/**
 * Get makes available for a vehicle type (with vehicle counts).
 */
export async function getMakesForType(typeId: number) {
  const supabase = createServiceClient();

  // All makes for this type
  const { data: makes } = await supabase
    .from('vehicle_makes')
    .select('id, name, slug, type_ids')
    .eq('active', true)
    .contains('type_ids', [typeId])
    .order('name');

  if (!makes) return [];

  // Count vehicles per make within this type
  const { data: vehicleCounts } = await supabase
    .from('vehicles')
    .select('make_id')
    .eq('status', 'active')
    .eq('vehicle_type_id', typeId);

  const countMap = new Map<number, number>();
  (vehicleCounts ?? []).forEach((row: any) => {
    countMap.set(row.make_id, (countMap.get(row.make_id) ?? 0) + 1);
  });

  return (makes as any[])
    .map((m) => ({ ...m, count: countMap.get(m.id) ?? 0 }))
    .filter((m) => m.count > 0); // only show makes with active listings
}

/**
 * Get stats + listings for a make+type combo. Powers the landing page.
 */
export async function getMakeTypeStats(
  typeId: number,
  makeId: number,
): Promise<CategoryStats> {
  const supabase = createServiceClient();

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('price, year, model')
    .eq('status', 'active')
    .eq('vehicle_type_id', typeId)
    .eq('make_id', makeId)
    .limit(1000);

  if (!vehicles || vehicles.length === 0) {
    return {
      total: 0,
      avgPrice: null,
      minPrice: null,
      maxPrice: null,
      popularModels: [],
      yearRange: null,
    };
  }

  const prices = (vehicles as any[]).map((v) => v.price).filter((p) => p > 0);
  const years = (vehicles as any[]).map((v) => v.year).filter((y) => y > 1900);

  const modelCounts = new Map<string, number>();
  (vehicles as any[]).forEach((v) => {
    if (v.model) modelCounts.set(v.model, (modelCounts.get(v.model) ?? 0) + 1);
  });
  const popularModels = Array.from(modelCounts.entries())
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    total: vehicles.length,
    avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    popularModels,
    yearRange: years.length ? { min: Math.min(...years), max: Math.max(...years) } : null,
  };
}

/**
 * Get sample listings to show on a landing page (first 12).
 */
export async function getLandingPageListings(filters: {
  typeId?: number;
  makeId?: number;
  cityId?: number;
  districtId?: number;
  model?: string;
}) {
  const supabase = createServiceClient();

  let q = supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year, price, mileage_km, fuel_type, transmission, view_count, created_at,
      vehicle_makes ( name ),
      districts ( name_en ),
      cities ( name_en ),
      vehicle_images ( url, is_primary, sort_order ),
      boosts!boosts_vehicle_id_fkey ( status, boost_plans ( type ) )
    `,
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(12);

  if (filters.typeId) q = q.eq('vehicle_type_id', filters.typeId);
  if (filters.makeId) q = q.eq('make_id', filters.makeId);
  if (filters.cityId) q = q.eq('city_id', filters.cityId);
  if (filters.districtId) q = q.eq('district_id', filters.districtId);
  if (filters.model) q = q.ilike('model', `%${filters.model}%`);

  const { data } = await q;

  return (data ?? []).map((row: any) => {
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
      condition: 'used',
      primary_image: images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null,
      is_boosted: !!activeBoost,
      boost_type: activeBoost?.boost_plans?.type ?? null,
      price_dropped: false,
      created_at: row.created_at,
      view_count: row.view_count ?? 0,
    };
  });
}

// ============================================================================
// CITY pages
// ============================================================================

export async function getCityBySlug(citySlug: string) {
  // We don't have city slugs, so use lowercase name_en match
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('cities')
    .select('id, name_en, name_si, district_id, districts ( id, name_en )')
    .ilike('name_en', citySlug.replace(/-/g, ' '))
    .single();
  return data as any;
}

export async function getDistrictBySlug(districtSlug: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('districts')
    .select('id, name_en, name_si')
    .ilike('name_en', districtSlug.replace(/-/g, ' '))
    .single();
  return data as any;
}

export async function getAllCitiesWithCounts() {
  const supabase = createServiceClient();
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name_en, name_si, district_id, districts ( name_en )')
    .order('name_en');

  if (!cities) return [];

  const { data: counts } = await supabase
    .from('vehicles')
    .select('city_id')
    .eq('status', 'active');

  const countMap = new Map<number, number>();
  (counts ?? []).forEach((row: any) => {
    if (row.city_id) countMap.set(row.city_id, (countMap.get(row.city_id) ?? 0) + 1);
  });

  return (cities as any[]).map((c) => ({
    ...c,
    count: countMap.get(c.id) ?? 0,
  }));
}

export async function getAllDistrictsWithCounts() {
  const supabase = createServiceClient();
  const { data: districts } = await supabase
    .from('districts')
    .select('id, name_en, name_si')
    .order('sort_order');

  if (!districts) return [];

  const { data: counts } = await supabase
    .from('vehicles')
    .select('district_id')
    .eq('status', 'active');

  const countMap = new Map<number, number>();
  (counts ?? []).forEach((row: any) => {
    if (row.district_id) countMap.set(row.district_id, (countMap.get(row.district_id) ?? 0) + 1);
  });

  return (districts as any[]).map((d) => ({
    ...d,
    count: countMap.get(d.id) ?? 0,
  }));
}

/**
 * Helper to slugify city/district names for URLs.
 */
export function slugifyLocation(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// PRICE GUIDE
// ============================================================================

export interface PriceGuideStats {
  total: number;
  avgPrice: number;
  byYear: { year: number; count: number; avgPrice: number; minPrice: number; maxPrice: number }[];
  byMileage: { bracket: string; count: number; avgPrice: number }[];
}

/**
 * Compute price-guide stats for a specific make+model.
 * Heavy query — must be revalidated daily, not per request.
 */
export async function getPriceGuide(makeId: number, model: string): Promise<PriceGuideStats | null> {
  const supabase = createServiceClient();

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('price, year, mileage_km')
    .eq('make_id', makeId)
    .ilike('model', `%${model}%`)
    .in('status', ['active', 'sold'])
    .limit(2000);

  if (!vehicles || vehicles.length === 0) return null;

  const all = vehicles as any[];
  const prices = all.map((v) => v.price).filter((p) => p > 0);

  // Group by year
  const byYearMap = new Map<number, number[]>();
  all.forEach((v) => {
    if (v.year && v.price > 0) {
      if (!byYearMap.has(v.year)) byYearMap.set(v.year, []);
      byYearMap.get(v.year)!.push(v.price);
    }
  });

  const byYear = Array.from(byYearMap.entries())
    .map(([year, ps]) => ({
      year,
      count: ps.length,
      avgPrice: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length),
      minPrice: Math.min(...ps),
      maxPrice: Math.max(...ps),
    }))
    .sort((a, b) => b.year - a.year);

  // Group by mileage brackets
  const brackets = [
    { label: 'Under 25,000 km', min: 0, max: 25000 },
    { label: '25,000 - 50,000 km', min: 25000, max: 50000 },
    { label: '50,000 - 100,000 km', min: 50000, max: 100000 },
    { label: '100,000 - 150,000 km', min: 100000, max: 150000 },
    { label: 'Over 150,000 km', min: 150000, max: Number.MAX_SAFE_INTEGER },
  ];

  const byMileage = brackets
    .map((b) => {
      const subset = all.filter(
        (v) => v.price > 0 && v.mileage_km != null && v.mileage_km >= b.min && v.mileage_km < b.max,
      );
      if (subset.length === 0) return null;
      const prices = subset.map((v) => v.price);
      return {
        bracket: b.label,
        count: subset.length,
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  return {
    total: vehicles.length,
    avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    byYear,
    byMileage,
  };
}

/**
 * Get top make+model pairs for the price guide index.
 */
export async function getTopMakeModels(limit = 20) {
  const supabase = createServiceClient();

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('make_id, model, vehicle_makes ( name, slug )')
    .in('status', ['active', 'sold'])
    .limit(5000);

  if (!vehicles) return [];

  const counts = new Map<string, { makeId: number; makeName: string; makeSlug: string; model: string; count: number }>();
  (vehicles as any[]).forEach((v) => {
    if (!v.model || !v.vehicle_makes?.name) return;
    const key = `${v.make_id}:${v.model.toLowerCase()}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, {
        makeId: v.make_id,
        makeName: v.vehicle_makes.name,
        makeSlug: v.vehicle_makes.slug,
        model: v.model,
        count: 1,
      });
    }
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
