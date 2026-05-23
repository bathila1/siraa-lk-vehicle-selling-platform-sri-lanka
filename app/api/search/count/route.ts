import { NextRequest, NextResponse } from 'next/server';

import { searchVehicles } from '@/lib/search/query-builder';
import { searchQuerySchema } from '@/lib/validations/schemas';

/**
 * Lightweight count-only endpoint for live filter previews.
 * Returns just the total count, not the full vehicle data.
 *
 * Used by the mobile filter drawer to show "Show X results" before
 * the user commits to applying the filters.
 *
 * Cached briefly (10s) so rapid filter toggling doesn't hammer the DB.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const raw: Record<string, string> = {};
  sp.forEach((value, key) => {
    if (key !== 'countOnly' && key !== 'page' && key !== 'perPage') {
      raw[key] = value;
    }
  });

  const parsed = searchQuerySchema.safeParse({
    ...raw,
    page: 1,
    perPage: 1,
    vehicleTypeId: raw.vehicleTypeId ? Number(raw.vehicleTypeId) : undefined,
    makeId: raw.makeId ? Number(raw.makeId) : undefined,
    districtId: raw.districtId ? Number(raw.districtId) : undefined,
    cityId: raw.cityId ? Number(raw.cityId) : undefined,
    yearMin: raw.yearMin ? Number(raw.yearMin) : undefined,
    yearMax: raw.yearMax ? Number(raw.yearMax) : undefined,
    priceMin: raw.priceMin ? Number(raw.priceMin) : undefined,
    priceMax: raw.priceMax ? Number(raw.priceMax) : undefined,
    sort: raw.sort ?? 'newest',
  });

  if (!parsed.success) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  try {
    const { total } = await searchVehicles(parsed.data);
    return NextResponse.json(
      { count: total },
      {
        headers: {
          'Cache-Control': 'public, max-age=10, s-maxage=10, stale-while-revalidate=30',
        },
      },
    );
  } catch (err) {
    console.error('[search count]', err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
