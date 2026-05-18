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
  const reportId = parseInt(id);
  if (isNaN(reportId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const adminNotes = body.adminNotes ?? null;

  if (body.action === 'resolve_and_hide') {
    if (!body.vehicleId) {
      return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });
    }

    await supabase
      .from('vehicles')
      .update({ status: 'hidden', hidden_at: now, hide_reason: 'report_resolved' } as any)
      .eq('id', body.vehicleId);

    await supabase
      .from('reports')
      .update({
        status: 'resolved',
        admin_notes: adminNotes,
        resolved_by: session.admin_id,
        resolved_at: now,
      } as any)
      .eq('id', reportId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'report.resolve_and_hide',
      targetType: 'report',
      targetId: reportId,
      details: { vehicleId: body.vehicleId, notes: adminNotes },
    });
  } else if (body.action === 'resolve') {
    await supabase
      .from('reports')
      .update({
        status: 'resolved',
        admin_notes: adminNotes,
        resolved_by: session.admin_id,
        resolved_at: now,
      } as any)
      .eq('id', reportId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'report.resolve',
      targetType: 'report',
      targetId: reportId,
      details: { notes: adminNotes },
    });
  } else if (body.action === 'dismiss') {
    await supabase
      .from('reports')
      .update({
        status: 'dismissed',
        admin_notes: adminNotes,
        resolved_by: session.admin_id,
        resolved_at: now,
      } as any)
      .eq('id', reportId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'report.dismiss',
      targetType: 'report',
      targetId: reportId,
      details: { notes: adminNotes },
    });
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
