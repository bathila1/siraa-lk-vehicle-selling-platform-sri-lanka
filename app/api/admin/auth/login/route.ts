import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { verifyTurnstileToken } from '@/lib/auth/turnstile';
import { rateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { createServiceClient } from '@/lib/supabase/server';
import { setAdminSession } from '@/lib/auth/admin-session';
import { logAuditEvent } from '@/lib/auth/audit-log';

/**
 * Admin login via password.
 *
 * Body: { phone, password, captchaToken }
 *
 * Password storage:
 *   ADMIN_PASSWORD_HASH = bcrypt hash of your password
 *   (Generate with: node -e "console.log(require('bcryptjs').hashSync('your-password', 10))")
 *
 * Falls back to ADMIN_PASSWORD (plain text) for backward compatibility, but
 * logs a warning. Always prefer the hashed version.
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

  // Rate limit
  const rl = await rateLimit(`admin_login:${ip}`, RATE_LIMITS.adminLogin);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 },
    );
  }

  // Password verification — prefer hashed
  const hashB64 = process.env.ADMIN_PASSWORD_HASH_B64;
  const hash = hashB64
    ? Buffer.from(hashB64, 'base64').toString('utf-8')
    : process.env.ADMIN_PASSWORD_HASH;

  const plain = process.env.ADMIN_PASSWORD;

  let passwordOk = false;
  if (hash && hash.length > 0) {
    try {
      passwordOk = await bcrypt.compare(body.password, hash);
    } catch (e) {
      console.log('[DEBUG admin login] bcrypt error:', e);
      passwordOk = false;
    }
  } else if (plain && plain.length >= 8) {
    console.warn(
      '[admin login] Using plaintext ADMIN_PASSWORD. ' +
        'Migrate to ADMIN_PASSWORD_HASH for better security.',
    );
    passwordOk = body.password === plain;
  } else {
    console.error('[admin login] No ADMIN_PASSWORD_HASH or ADMIN_PASSWORD configured');
    return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
  }

  if (!passwordOk) {
    // Constant-ish-time sleep to make timing attacks harder
    await new Promise((r) => setTimeout(r, 300));
    return NextResponse.json({ error: 'Wrong credentials.' }, { status: 401 });
  }

  // Password OK — now verify phone belongs to an active admin
  const supabase = createServiceClient();
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, full_name, role, active')
    .eq('phone', body.phone)
    .single();

  if (!admin || !(admin as any).active) {
    await new Promise((r) => setTimeout(r, 300));
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
