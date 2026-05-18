import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('order_id');
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: payment } = await supabase
    .from('payments')
    .select('status, completed_at')
    .eq('gateway_order_id', orderId)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    status: payment.status,
    completed_at: payment.completed_at,
  });
}
