import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function POST(request: NextRequest) {
  let session;
  try { session = await requireAdmin(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.slug || !Array.isArray(body.type_ids) || body.type_ids.length === 0) {
    return NextResponse.json({ error: 'name, slug, and type_ids required.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('vehicle_makes').insert({
    name: body.name,
    slug: body.slug,
    type_ids: body.type_ids,
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
    action: 'vehicle_make.create',
    details: { name: body.name, slug: body.slug },
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
  if (body.name !== undefined) patch.name = body.name;
  if (body.type_ids !== undefined) patch.type_ids = body.type_ids;
  if (body.active !== undefined) patch.active = body.active;
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order;

  const supabase = createServiceClient();
  const { error } = await supabase.from('vehicle_makes').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 });

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'vehicle_make.update',
    targetType: 'vehicle_make',
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

  const { count } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('make_id', id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${count} vehicle(s) still use this make. Deactivate instead.` },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('vehicle_makes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Delete failed.' }, { status: 500 });

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'vehicle_make.delete',
    targetType: 'vehicle_make',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
