import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Lets a seller cancel their own PENDING boost.
 * Only cancels if status is still pending — never touches active or paid boosts.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const boostId = parseInt(id);
  if (isNaN(boostId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const supabase = createServiceClient();

  // Verify ownership via vehicle → seller_id
  const { data: boost } = await supabase
    .from('boosts')
    .select('id, status, payment_id, vehicles!inner ( seller_id )')
    .eq('id', boostId)
    .single();

  if (!boost) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if ((boost as any).vehicles?.seller_id !== session.seller_id) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  if ((boost as any).status !== 'pending') {
    return NextResponse.json(
      { error: 'Only pending boosts can be cancelled.' },
      { status: 400 },
    );
  }

  // Cancel boost + linked payment
  await supabase
    .from('boosts')
    .update({ status: 'cancelled' } as any)
    .eq('id', boostId);

  if ((boost as any).payment_id) {
    await supabase
      .from('payments')
      .update({ status: 'cancelled' } as any)
      .eq('id', (boost as any).payment_id)
      .eq('status', 'pending'); // safety — never touch completed
  }

  return NextResponse.json({ ok: true });
}