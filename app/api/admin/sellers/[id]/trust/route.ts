import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

/**
 * Grant or revoke trusted-seller status for a seller.
 *
 * PATCH /api/admin/sellers/[id]/trust
 *   body: { action: 'grant' | 'revoke', reason?: string }
 */
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
  if (!id) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body?.action || !['grant', 'revoke'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (body.action === 'grant') {
    const { error } = await supabase
      .from('sellers')
      .update({
        trusted_at: new Date().toISOString(),
        trusted_by_admin: session.admin_id,
        trusted_reason: body.reason ?? null,
      } as any)
      .eq('id', id);

    if (error) {
      console.error('[trust grant]', error);
      return NextResponse.json({ error: 'Failed.' }, { status: 500 });
    }

    // Drop a notification so the seller sees the badge mention
    await supabase.from('notifications').insert({
      seller_id: id,
      category: 'system',
      title: 'You are now a Trusted Seller!',
      body: 'Your account has been manually verified by Siraa.lk. Buyers will see a trust badge on your listings.',
      link_url: `/seller/${id}`,
    } as any);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'seller.trust_grant',
      targetType: 'seller',
      targetId: id,
      details: { reason: body.reason ?? null },
    });
  } else {
    // revoke
    const { error } = await supabase
      .from('sellers')
      .update({
        trusted_at: null,
        trusted_by_admin: null,
        trusted_reason: null,
      } as any)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed.' }, { status: 500 });
    }

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'seller.trust_revoke',
      targetType: 'seller',
      targetId: id,
      details: { reason: body.reason ?? null },
    });
  }

  return NextResponse.json({ ok: true });
}
