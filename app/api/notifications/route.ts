import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications — recent notifications for the logged-in seller.
 * Returns up to 20 newest items.
 */
export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('notifications')
    .select('id, category, title, body, link_url, read_at, created_at')
    .eq('seller_id', session.seller_id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ notifications: data ?? [] });
}
