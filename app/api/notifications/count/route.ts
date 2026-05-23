import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications/count
 * Returns only the unread count. Polled every minute by the bell icon.
 */
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ unread: 0 });

  const supabase = createServiceClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', session.seller_id)
    .is('read_at', null);

  return NextResponse.json(
    { unread: count ?? 0 },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
