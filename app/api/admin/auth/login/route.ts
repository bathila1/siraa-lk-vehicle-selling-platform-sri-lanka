import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { verifyTurnstileToken } from '@/lib/auth/turnstile';
import { createServiceClient } from '@/lib/supabase/server';
import { setAdminSession } from '@/lib/auth/admin-session';
import { logAuditEvent } from '@/lib/auth/audit-log';

/**
 * Admin login via shared password from env.
 * Body: { phone, password, captchaToken }
 * The phone is used to look up which admin row to associate the session with
 * (for audit log + role), but the password check is global.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  if (!body?.phone || !body?.password || !body?.captchaToken) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  // Bot check
  const captchaOk = await verifyTurnstileToken(body.captchaToken, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: 'Bot check failed.' }, { status: 403 });
  }

  // Rate limit — by IP since password is shared

  // ...

  const rl = await rateLimit(`admin_login:${ip}`, RATE_LIMITS.adminLogin);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 },
    );
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 8) {
    console.error('[admin login] ADMIN_PASSWORD not set or too short');
    return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
  }

  // Constant-time-ish password check
  if (body.password !== expected) {
    // Sleep briefly to make timing attacks less useful
    await new Promise((r) => setTimeout(r, 300));
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  // Password is correct — now make sure this phone is registered as admin
  const supabase = createServiceClient();
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, full_name, role, active')
    .eq('phone', body.phone)
    .single();

  if (!admin || !(admin as any).active) {
    return NextResponse.json({ error: 'This phone is not registered as admin.' }, { status: 403 });
  }

  await supabase
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() } as any)
    .eq('id', (admin as any).id);

  const a = admin as any;
  await setAdminSession({ admin_id: a.id, phone: body.phone, role: a.role });

  await logAuditEvent({
    adminId: a.id,
    action: 'admin.login',
    ip,
  });

  return NextResponse.json({ ok: true });
}
