import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function POST(request: NextRequest) {
  let session;
  try { session = await requireAdmin(); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const body = await request.json().catch(() => null);
  if (!body?.field_key || !body?.label_en || !body?.field_type) {
    return NextResponse.json({ error: 'field_key, label_en, and field_type required.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('vehicle_attributes_schema').insert({
    vehicle_type_id: body.vehicle_type_id,
    field_key: body.field_key,
    label_en: body.label_en,
    label_si: body.label_si ?? null,
    field_type: body.field_type,
    options: body.options ?? null,
    required: !!body.required,
    sort_order: body.sort_order ?? 999,
    active: body.active !== false,
  } as any);

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('duplicate') ? 'A field with this key already exists.' : 'Save failed.' },
      { status: 400 },
    );
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'attribute.create',
    details: { field_key: body.field_key, label_en: body.label_en },
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
  if (body.vehicle_type_id !== undefined) patch.vehicle_type_id = body.vehicle_type_id;
  if (body.field_key !== undefined) patch.field_key = body.field_key;
  if (body.label_en !== undefined) patch.label_en = body.label_en;
  if (body.label_si !== undefined) patch.label_si = body.label_si;
  if (body.field_type !== undefined) patch.field_type = body.field_type;
  if (body.options !== undefined) patch.options = body.options;
  if (body.required !== undefined) patch.required = body.required;
  if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
  if (body.active !== undefined) patch.active = body.active;

  const supabase = createServiceClient();
  const { error } = await supabase.from('vehicle_attributes_schema').update(patch).eq('id', id);
  if (error) {
    console.error('[attribute PATCH]', error);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'attribute.update',
    targetType: 'attribute',
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
  const { error } = await supabase.from('vehicle_attributes_schema').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Delete failed.' }, { status: 500 });

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'attribute.delete',
    targetType: 'attribute',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}