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
  if (!body?.key || body.value === undefined) {
    return NextResponse.json({ error: 'Missing key/value' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('site_settings')
    .update({ value: body.value } as any)
    .eq('key', body.key);

  if (error) {
    return NextResponse.json({ error: 'Save failed.' }, { status: 500 });
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'site_settings.update',
    targetType: 'site_setting',
    targetId: body.key,
    details: { key: body.key },
  });

  return NextResponse.json({ ok: true });
}
