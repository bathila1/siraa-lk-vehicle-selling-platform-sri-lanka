import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  await supabase
    .from('vehicles')
    .update({ status: 'sold', sold_at: new Date().toISOString() })
    .eq('id', vehicleId);

  return NextResponse.json({ ok: true });
}
