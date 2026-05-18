import { NextRequest, NextResponse } from 'next/server';

import { vehicleUpdateSchema } from '@/lib/validations/schemas';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const vehicleId = parseInt(id);
  if (isNaN(vehicleId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = vehicleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from('vehicles')
    .select('seller_id')
    .eq('id', vehicleId)
    .single();

  if (!existing || existing.seller_id !== session.seller_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const v = parsed.data;
  const patch: any = {};
  if (v.model !== undefined)         patch.model = v.model;
  if (v.year !== undefined)          patch.year = v.year;
  if (v.price !== undefined)         patch.price = v.price;
  if (v.mileageKm !== undefined)     patch.mileage_km = v.mileageKm;
  if (v.engineCc !== undefined)      patch.engine_cc = v.engineCc;
  if (v.bodyType !== undefined)      patch.body_type = v.bodyType;
  if (v.transmission !== undefined)  patch.transmission = v.transmission;
  if (v.fuelType !== undefined)      patch.fuel_type = v.fuelType;
  if (v.color !== undefined)         patch.color = v.color;
  if (v.previousOwners !== undefined) patch.previous_owners = v.previousOwners;
  if (v.description !== undefined)   patch.description = v.description;
  if (v.districtId !== undefined)    patch.district_id = v.districtId;
  if (v.cityId !== undefined)        patch.city_id = v.cityId;
  if (v.lat !== undefined)           patch.lat = v.lat;
  if (v.lng !== undefined)           patch.lng = v.lng;
  if (v.customAttributes !== undefined) patch.custom_attributes = v.customAttributes;

  const { error } = await supabase
    .from('vehicles')
    .update(patch)
    .eq('id', vehicleId);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const vehicleId = parseInt(id);
  if (isNaN(vehicleId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('vehicles')
    .select('seller_id')
    .eq('id', vehicleId)
    .single();

  if (!existing || existing.seller_id !== session.seller_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Soft delete — hide instead of removing
  await supabase
    .from('vehicles')
    .update({ status: 'hidden', hidden_at: new Date().toISOString() })
    .eq('id', vehicleId);

  return NextResponse.json({ ok: true });
}
