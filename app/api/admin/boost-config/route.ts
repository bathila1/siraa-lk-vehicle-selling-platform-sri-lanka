import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function PATCH(request: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const supabase = createServiceClient();

  // Update plans
  if (Array.isArray(body.plans)) {
    for (const plan of body.plans) {
      if (!plan?.id) continue;
      await supabase
        .from('boost_plans')
        .update({
          price: Number(plan.price),
          duration_days: Number(plan.duration_days),
          description: plan.description ?? null,
          active: !!plan.active,
        } as any)
        .eq('id', plan.id);
    }
  }

  // Update slot counts
  if (Array.isArray(body.slots)) {
    for (const slot of body.slots) {
      if (!slot?.slot_key) continue;
      await supabase
        .from('boost_slot_config')
        .update({ count: Number(slot.count) } as any)
        .eq('slot_key', slot.slot_key);
    }
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'boost_config.update',
    targetType: 'boost_config',
  });

  return NextResponse.json({ ok: true });
}
