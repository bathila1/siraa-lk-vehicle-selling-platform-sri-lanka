import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

const ALLOWED_STATUSES = ['new', 'in_progress', 'fulfilled', 'closed', 'spam'];

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
  const reqId = parseInt(id);
  if (isNaN(reqId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body?.status || !ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const patch: any = {
    status: body.status,
    updated_at: now,
    assigned_to: session.admin_id,
  };

  if (body.markContacted) {
    patch.contacted_at = now;
  }
  if (body.status === 'fulfilled') {
    patch.fulfilled_at = now;
    if (!body.markContacted) patch.contacted_at = patch.contacted_at ?? now;
  }
  if (body.adminNotes !== undefined) {
    patch.admin_notes = body.adminNotes;
  }

  const { error } = await supabase
    .from('vehicle_requests')
    .update(patch)
    .eq('id', reqId);

  if (error) {
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: `vehicle_request.${body.status}`,
    targetType: 'vehicle_request',
    targetId: reqId,
    details: body.markContacted ? { contacted: true } : undefined,
  });

  return NextResponse.json({ ok: true });
}
