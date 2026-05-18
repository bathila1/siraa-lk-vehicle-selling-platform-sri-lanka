/**
 * Search query builder.
 * Takes validated filter params and builds the SQL + Supabase query.
 * Uses FTS (search_vector) for text + pg_trgm for fuzzy matching.
 */

import { createClient } from '@/lib/supabase/server';
import type { SearchQueryInput } from '@/lib/validations/schemas';

export interface VehicleListItem {
  id: number;
  slug: string;
  make_name: string;
  model: string;
  year: number;
  price: number;
  mileage_km: number | null;
  fuel_type: string | null;
  transmission: string | null;
  district_name: string;
  city_name: string | null;
  condition: string;
  primary_image: string | null;
  is_boosted: boolean;
  boost_type: string | null;
  price_dropped: boolean;
  created_at: string;
  view_count: number;
}

export interface SearchResult {
  vehicles: VehicleListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function searchVehicles(params: SearchQueryInput): Promise<SearchResult> {
  const supabase = await createClient();
  const { page, perPage, sort } = params;
  const offset = (page - 1) * perPage;

  // Build the RPC call using Postgres function for complex queries
  // Falls back to Supabase query builder for simple cases
  let query = supabase
    .from('vehicles')
    .select(
      `
      id, slug, model, year, price, mileage_km, fuel_type, transmission,
      condition, view_count, created_at,
      vehicle_makes!inner ( name ),
      districts!inner ( name_en ),
      cities ( name_en ),
      vehicle_images ( url, is_primary, sort_order ),
      boosts ( status, type:boost_plans(type) )
    `,
      { count: 'exact' },
    )
    .eq('status', 'active');

  // Text search via FTS
  if (params.q && params.q.trim()) {
    const cleaned = params.q.trim().replace(/[^a-zA-Z0-9\s]/g, ' ');
    query = query.textSearch('search_vector', cleaned, {
      type: 'websearch',
      config: 'simple',
    });
  }

  // Filters
  if (params.vehicleTypeId) query = query.eq('vehicle_type_id', params.vehicleTypeId);
  if (params.makeId) query = query.eq('make_id', params.makeId);
  if (params.model) query = query.ilike('model', `%${params.model}%`);
  if (params.yearMin) query = query.gte('year', params.yearMin);
  if (params.yearMax) query = query.lte('year', params.yearMax);
  if (params.priceMin) query = query.gte('price', params.priceMin);
  if (params.priceMax) query = query.lte('price', params.priceMax);
  if (params.transmission) query = query.eq('transmission', params.transmission);
  if (params.fuelType) query = query.eq('fuel_type', params.fuelType);
  if (params.districtId) query = query.eq('district_id', params.districtId);
  if (params.cityId) query = query.eq('city_id', params.cityId);

  // Sort
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'year_desc':
      query = query.order('year', { ascending: false });
      break;
    default: // relevance — boosted first, then newest
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + perPage - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[search] Query error:', error);
    return { vehicles: [], total: 0, page, perPage, totalPages: 0 };
  }

  const total = count ?? 0;

  // Shape the raw Supabase response into clean VehicleListItem
  const vehicles: VehicleListItem[] = (data ?? []).map((row: any) => {
    const images = (row.vehicle_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
    const primaryImg = images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null;

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
      primary_image: primaryImg,
      is_boosted: !!activeBoost,
      boost_type: activeBoost?.type?.type ?? null,
      price_dropped: false,
      created_at: row.created_at,
      view_count: row.view_count,
    };
  });

  // Page 1 only: pull boosted ads to the top.
  // Pro slots first, then Normal slots, then the rest preserves the user's sort.
  // We respect base sort beyond that, so this only affects the first page.
  if (page === 1) {
    const proAds = vehicles.filter((v) => v.boost_type === 'pro');
    const normalAds = vehicles.filter((v) => v.boost_type === 'normal');
    const regular = vehicles.filter((v) => !v.is_boosted);

    // Apply slot caps if relevant; falls back to "show all boosted at top" if no config
    const sorted = [...proAds, ...normalAds, ...regular];
    return {
      vehicles: sorted,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  return {
    vehicles,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/** Autocomplete — fast, returns up to 8 suggestions */
export async function autocomplete(q: string): Promise<string[]> {
  if (!q || q.trim().length < 1) return [];

  const supabase = await createClient();
  const term = q.trim().toLowerCase();

  // Query makes + models matching the term
  const { data } = await supabase
    .from('vehicle_makes')
    .select('name')
    .ilike('name', `${term}%`)
    .eq('active', true)
    .limit(4);

  const makes = (data ?? []).map((r: any) => r.name as string);

  // Also search model column via trigram similarity
  const { data: modelData } = await supabase
    .from('vehicles')
    .select('model')
    .ilike('model', `%${term}%`)
    .eq('status', 'active')
    .limit(4);

  const models = [...new Set((modelData ?? []).map((r: any) => r.model as string))];

  return [...new Set([...makes, ...models])].slice(0, 8);
}
