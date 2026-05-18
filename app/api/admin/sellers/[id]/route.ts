import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (body.action === 'ban') {
    await supabase
      .from('sellers')
      .update({
        banned_at: new Date().toISOString(),
        banned_reason: body.reason ?? null,
      } as any)
      .eq('id', id);

    // Also hide all their active vehicles
    await supabase
      .from('vehicles')
      .update({ status: 'hidden', hidden_at: new Date().toISOString(), hide_reason: 'seller_banned' } as any)
      .eq('seller_id', id)
      .eq('status', 'active');

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'seller.ban',
      targetType: 'seller',
      targetId: id,
      details: { reason: body.reason },
    });
  } else if (body.action === 'unban') {
    await supabase
      .from('sellers')
      .update({ banned_at: null, banned_reason: null } as any)
      .eq('id', id);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'seller.unban',
      targetType: 'seller',
      targetId: id,
    });
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
