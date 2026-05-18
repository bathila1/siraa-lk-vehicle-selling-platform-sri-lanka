import { NextRequest, NextResponse } from 'next/server';

import { vehicleCreateSchema } from '@/lib/validations/schemas';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { buildVehicleSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = vehicleCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const v = parsed.data;

  // Look up make/city names for the slug
  const [{ data: make }, { data: city }] = await Promise.all([
    supabase.from('vehicle_makes').select('name').eq('id', v.makeId).single(),
    v.cityId
      ? supabase.from('cities').select('name_en').eq('id', v.cityId).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!make) return NextResponse.json({ error: 'Invalid make.' }, { status: 400 });

  const slug = buildVehicleSlug({
    make: make.name,
    model: v.model,
    year: v.year,
    city: city?.name_en ?? null,
  });

  // Insert vehicle
  const { data: vehicle, error: insertError } = await supabase
    .from('vehicles')
    .insert({
      slug,
      seller_id: session.seller_id,
      vehicle_type_id: v.vehicleTypeId,
      make_id: v.makeId,
      model: v.model,
      year: v.year,
      price: v.price,
      mileage_km: v.mileageKm ?? null,
      engine_cc: v.engineCc ?? null,
      body_type: v.bodyType ?? null,
      transmission: v.transmission ?? null,
      fuel_type: v.fuelType ?? null,
      condition: v.condition,
      color: v.color ?? null,
      previous_owners: v.previousOwners ?? null,
      description: v.description ?? null,
      district_id: v.districtId,
      city_id: v.cityId ?? null,
      lat: v.lat ?? null,
      lng: v.lng ?? null,
      custom_attributes: (v.customAttributes ?? {}) as any,
      status: 'active', // Auto-publish (phone-verified sellers + report system)
    })
    .select('id, slug')
    .single();

  if (insertError || !vehicle) {
    console.error('[vehicles POST] Insert failed:', insertError);
    return NextResponse.json({ error: 'Failed to create vehicle.' }, { status: 500 });
  }

  // Insert images
  const imageRows = v.imageIds.map((url, idx) => ({
    vehicle_id: vehicle.id,
    url,
    sort_order: idx,
    is_primary: idx === 0,
  }));

  const { error: imgError } = await supabase.from('vehicle_images').insert(imageRows);
  if (imgError) {
    console.error('[vehicles POST] Image insert failed:', imgError);
    // Don't roll back — vehicle is live, user can add images via edit
  }

  // Mark seller's free_posting_used if promo applies
  const { data: promoSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'promo_first_100_sellers')
    .single();

  const promo = promoSetting?.value as any;
  if (promo?.active && promo?.current_count < promo?.max_count) {
    await supabase
      .from('site_settings')
      .update({ value: { ...promo, current_count: (promo.current_count ?? 0) + 1 } })
      .eq('key', 'promo_first_100_sellers');

    await supabase.from('sellers').update({ free_posting_used: true }).eq('id', session.seller_id);
  }

  return NextResponse.json({ ok: true, id: vehicle.id, slug: vehicle.slug });
}
