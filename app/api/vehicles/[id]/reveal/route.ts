import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const vehicleId = parseInt(id);
  if (isNaN(vehicleId)) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createServiceClient();
  await supabase.rpc('increment_contact_reveal', { p_vehicle_id: vehicleId });

  return NextResponse.json({ ok: true });
}
