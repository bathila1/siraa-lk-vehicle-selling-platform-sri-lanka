import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { otpRequestSchema, otpVerifySchema } from '@/lib/validations/schemas';
import { verifyTurnstileToken } from '@/lib/auth/turnstile';
import { rateLimitOtpRequest, rateLimitOtpVerify } from '@/lib/auth/rate-limit';
import { generateOtpCode, sendOtp } from '@/lib/smslenz';
import { createServiceClient } from '@/lib/supabase/server';
import { setAdminSession } from '@/lib/auth/admin-session';
import { logAuditEvent } from '@/lib/auth/audit-log';

/**
 * Admin login is a single endpoint that handles both request + verify based
 * on whether 'code' is present. Simpler than two endpoints for a rarely-used flow.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const supabase = createServiceClient();

  // Branch 1: verify code
  if (body?.code) {
    const parsed = otpVerifySchema.safeParse({ ...body, purpose: 'admin_login' });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }
    const { phone, code } = parsed.data;

    const rl = rateLimitOtpVerify(phone);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 },
      );
    }

    // Confirm phone belongs to an admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id, full_name, role, active')
      .eq('phone', phone)
      .single();

    if (!admin || !(admin as any).active) {
      return NextResponse.json({ error: 'Wrong code.' }, { status: 400 });
    }

    // Find OTP
    const { data: otp } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('purpose', 'admin_login')
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) {
      return NextResponse.json(
        { error: 'Code expired. Request a new one.' },
        { status: 400 },
      );
    }
    const otpRow = otp as any;

    if (otpRow.attempts >= 5) {
      await supabase
        .from('otp_codes')
        .update({ consumed_at: new Date().toISOString() } as any)
        .eq('id', otpRow.id);
      return NextResponse.json({ error: 'Too many wrong tries.' }, { status: 429 });
    }

    const ok = await bcrypt.compare(code, otpRow.code_hash);
    if (!ok) {
      await supabase
        .from('otp_codes')
        .update({ attempts: otpRow.attempts + 1 } as any)
        .eq('id', otpRow.id);
      return NextResponse.json({ error: 'Wrong code.' }, { status: 400 });
    }

    await supabase
      .from('otp_codes')
      .update({ consumed_at: new Date().toISOString() } as any)
      .eq('id', otpRow.id);

    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() } as any)
      .eq('id', (admin as any).id);

    const a = admin as any;
    await setAdminSession({ admin_id: a.id, phone, role: a.role });

    await logAuditEvent({
      adminId: a.id,
      action: 'admin.login',
      ip,
    });

    return NextResponse.json({ ok: true });
  }

  // Branch 2: request OTP
  const parsed = otpRequestSchema.safeParse({
    ...body,
    purpose: 'admin_login',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }
  const { phone, captchaToken } = parsed.data;

  const captchaOk = await verifyTurnstileToken(captchaToken, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: 'Bot check failed.' }, { status: 403 });
  }

  const rl = rateLimitOtpRequest(phone, ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  // Confirm phone is a registered admin (without leaking which is which)
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, active')
    .eq('phone', phone)
    .single();

  // To avoid leaking admin phone numbers, always return ok=true
  // even if the phone isn't in admin_users. The verify step is where it'll fail.
  if (!admin || !(admin as any).active) {
    // Sleep briefly so timing doesn't leak
    await new Promise((r) => setTimeout(r, 200));
    return NextResponse.json({ ok: true, expiresIn: 600 });
  }

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60_000);

  await supabase
    .from('otp_codes')
    .update({ consumed_at: new Date().toISOString() } as any)
    .eq('phone', phone)
    .eq('purpose', 'admin_login')
    .is('consumed_at', null);

  await supabase.from('otp_codes').insert({
    phone,
    code_hash: codeHash,
    purpose: 'admin_login',
    expires_at: expiresAt.toISOString(),
    ip_address: ip === 'unknown' ? null : ip,
  } as any);

  await sendOtp(phone, code);

  return NextResponse.json({ ok: true, expiresIn: 600 });
}
