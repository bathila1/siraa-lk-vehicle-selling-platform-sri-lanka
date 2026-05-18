import { NextResponse } from 'next/server';
import { clearAdminSession, getAdminSession } from '@/lib/auth/admin-session';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    await logAuditEvent({ adminId: session.admin_id, action: 'admin.logout' });
  }
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
