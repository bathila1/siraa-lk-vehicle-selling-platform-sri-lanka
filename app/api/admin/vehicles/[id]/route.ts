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
  const vehicleId = parseInt(id);
  if (isNaN(vehicleId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

  const supabase = createServiceClient();

  if (body.action === 'hide') {
    await supabase
      .from('vehicles')
      .update({
        status: 'hidden',
        hidden_at: new Date().toISOString(),
        hide_reason: body.reason ?? 'admin_action',
      } as any)
      .eq('id', vehicleId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'vehicle.hide',
      targetType: 'vehicle',
      targetId: vehicleId,
      details: { reason: body.reason },
    });
  } else if (body.action === 'unhide') {
    await supabase
      .from('vehicles')
      .update({ status: 'active', hidden_at: null, hide_reason: null } as any)
      .eq('id', vehicleId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'vehicle.unhide',
      targetType: 'vehicle',
      targetId: vehicleId,
    });
  } else if (body.action === 'mark_sold') {
    await supabase
      .from('vehicles')
      .update({ status: 'sold', sold_at: new Date().toISOString() } as any)
      .eq('id', vehicleId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'vehicle.mark_sold',
      targetType: 'vehicle',
      targetId: vehicleId,
    });
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
