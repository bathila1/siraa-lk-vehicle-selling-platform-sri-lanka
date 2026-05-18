import { NextRequest, NextResponse } from 'next/server';

import { searchVehicles } from '@/lib/search/query-builder';
import { searchQuerySchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const raw = Object.fromEntries(searchParams.entries());

  const parsed = searchQuerySchema.safeParse({
    ...raw,
    page: raw.page ? Number(raw.page) : 1,
    perPage: raw.perPage ? Math.min(Number(raw.perPage), 48) : 24,
    vehicleTypeId: raw.vehicleTypeId ? Number(raw.vehicleTypeId) : undefined,
    makeId: raw.makeId ? Number(raw.makeId) : undefined,
    districtId: raw.districtId ? Number(raw.districtId) : undefined,
    cityId: raw.cityId ? Number(raw.cityId) : undefined,
    yearMin: raw.yearMin ? Number(raw.yearMin) : undefined,
    yearMax: raw.yearMax ? Number(raw.yearMax) : undefined,
    priceMin: raw.priceMin ? Number(raw.priceMin) : undefined,
    priceMax: raw.priceMax ? Number(raw.priceMax) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await searchVehicles(parsed.data);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
