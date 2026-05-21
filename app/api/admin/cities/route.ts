import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function POST(request: NextRequest) {
  let session;
  try { session = await requireAdmin(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const body = await request.json().catch(() => null);
  if (!body?.district_id || !body?.name_en) {
    return NextResponse.json({ error: 'district_id and name_en required.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('cities').insert({
    district_id: body.district_id,
    name_en: body.name_en,
    name_si: body.name_si ?? null,
    sort_order: 999,
  } as any);

  if (error) {
    return NextResponse.json({ error: 'Save failed.' }, { status: 500 });
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'city.create',
    details: { name_en: body.name_en, district_id: body.district_id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  let session;
  try { session = await requireAdmin(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabase = createServiceClient();
  const { count } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('city_id', id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `${count} vehicle(s) use this city. Cannot delete.` },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Delete failed.' }, { status: 500 });

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'city.delete',
    targetType: 'city',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
