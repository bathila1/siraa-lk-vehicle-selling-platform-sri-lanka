import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.vehicleId || !body?.planId) {
    return NextResponse.json({ error: 'vehicleId and planId required.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify vehicle exists + is active
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, status')
    .eq('id', body.vehicleId)
    .single();
  if (!vehicle) return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
  if ((vehicle as any).status !== 'active') {
    return NextResponse.json({ error: 'Vehicle is not active.' }, { status: 400 });
  }

  // Cancel any existing pending/active boost on this vehicle first
  await supabase
    .from('boosts')
    .update({ status: 'cancelled' } as any)
    .eq('vehicle_id', body.vehicleId)
    .in('status', ['pending', 'active']);

  const days = Math.max(1, Math.min(365, Number(body.days ?? 7)));
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + days * 86400_000);

  const { data: created, error } = await supabase
    .from('boosts')
    .insert({
      vehicle_id: body.vehicleId,
      plan_id: body.planId,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
      amount_paid: 0, // manual = free
      payment_id: null,
    } as any)
    .select('id')
    .single();

  if (error || !created) {
    console.error('[admin boost create]', error);
    return NextResponse.json({ error: 'Failed to create.' }, { status: 500 });
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'boost.manual_create',
    targetType: 'boost',
    targetId: (created as any).id,
    details: {
      vehicleId: body.vehicleId,
      planId: body.planId,
      days,
      reason: body.reason ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: (created as any).id });
}