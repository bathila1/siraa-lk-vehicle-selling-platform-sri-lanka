import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { sriLankanPhone } from '@/lib/validations/schemas';

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  districtId: z.number().int().positive(),
  cityId: z.number().int().positive().optional(),
  whatsappNumber: sriLankanPhone.optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('sellers')
    .update({
      full_name: parsed.data.fullName,
      district_id: parsed.data.districtId,
      city_id: parsed.data.cityId ?? null,
      whatsapp_number: parsed.data.whatsappNumber ?? null,
    })
    .eq('id', session.seller_id);

  if (error) {
    return NextResponse.json({ error: 'Save failed.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
