import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/notifications/[id]/read
 * Mark a single notification as read.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const notifId = parseInt(id);
  if (isNaN(notifId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const supabase = createServiceClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() } as any)
    .eq('id', notifId)
    .eq('seller_id', session.seller_id) // can only mark own as read
    .is('read_at', null);

  return NextResponse.json({ ok: true });
}
