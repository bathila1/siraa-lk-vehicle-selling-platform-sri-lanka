import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/notifications/read-all
 * Mark every unread notification for this seller as read.
 */
export async function POST(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() } as any)
    .eq('seller_id', session.seller_id)
    .is('read_at', null);

  return NextResponse.json({ ok: true });
}
