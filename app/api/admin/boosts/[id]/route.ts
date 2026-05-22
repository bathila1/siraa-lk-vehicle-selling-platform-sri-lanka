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
  const boostId = parseInt(id);
  if (isNaN(boostId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

  const supabase = createServiceClient();
  const now = new Date();

  if (body.action === 'activate') {
    const days = Math.max(1, Math.min(365, Number(body.days ?? 7)));
    const expiresAt = new Date(now.getTime() + days * 86400_000);

    await supabase
      .from('boosts')
      .update({
        status: 'active',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      } as any)
      .eq('id', boostId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'boost.admin_activate',
      targetType: 'boost',
      targetId: boostId,
      details: { days },
    });
  } else if (body.action === 'cancel') {
    await supabase
      .from('boosts')
      .update({ status: 'cancelled' } as any)
      .eq('id', boostId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'boost.admin_cancel',
      targetType: 'boost',
      targetId: boostId,
    });
  } else if (body.action === 'expire') {
    await supabase
      .from('boosts')
      .update({ status: 'expired', expires_at: now.toISOString() } as any)
      .eq('id', boostId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'boost.admin_expire',
      targetType: 'boost',
      targetId: boostId,
    });
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}