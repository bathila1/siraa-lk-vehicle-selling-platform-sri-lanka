import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function POST(request: NextRequest) {
  let session;
  try { session = await requireAdmin(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const body = await request.json().catch(() => null);
  if (!body?.name_en || !body?.slug) {
    return NextResponse.json({ error: 'name_en and slug required.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('vehicle_types').insert({
    name_en: body.name_en,
    name_si: body.name_si ?? null,
    slug: body.slug,
    sort_order: 999,
    active: true,
  } as any);

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('duplicate') ? 'Slug already exists.' : 'Save failed.' },
      { status: 400 },
    );
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'vehicle_type.create',
    details: { name_en: body.name_en, slug: body.slug },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  let session;
  try { session = await requireAdmin(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  const patch: any = {};
  if (body.name_en !== undefined) patch.name_en = body.name_en;
  if (body.name_si !== undefined) patch.name_si = body.name_si;
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
  if (body.active !== undefined) patch.active = body.active;

  const supabase = createServiceClient();
  const { error } = await supabase.from('vehicle_types').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'vehicle_type.update',
    targetType: 'vehicle_type',
    targetId: id,
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

  // Check if any vehicle still uses it
  const { count } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('vehicle_type_id', id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${count} vehicle(s) still use this type. Deactivate instead.` },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('vehicle_types').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Delete failed.' }, { status: 500 });

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'vehicle_type.delete',
    targetType: 'vehicle_type',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
