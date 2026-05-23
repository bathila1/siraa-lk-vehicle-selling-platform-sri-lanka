import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { otpRequestSchema } from '@/lib/validations/schemas';
import { verifyTurnstileToken } from '@/lib/auth/turnstile';
import { rateLimitOtpRequest } from '@/lib/auth/rate-limit';
import { generateOtpCode, sendOtp } from '@/lib/smslenz';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Parse + validate
  const body = await request.json().catch(() => null);
  const parsed = otpRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid phone number or missing captcha token.' },
      { status: 400 },
    );
  }

  const { phone, purpose, captchaToken } = parsed.data;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  // Turnstile check (kills bot floods that would burn SMS credit)
  const captchaOk = await verifyTurnstileToken(captchaToken, ip);
  if (!captchaOk) {
    return NextResponse.json(
      { error: 'Bot check failed. Please refresh and try again.' },
      { status: 403 },
    );
  }

  // Rate limit
  const rl = await rateLimitOtpRequest(phone, ip);  // ← await added
  if (!rl.allowed) {
    const minutes = Math.ceil((rl.resetAt - Date.now()) / 60_000);
    return NextResponse.json(
      { error: `Too many requests. Try again in ${minutes} minute(s).` },
      { status: 429 },
    );
  }

  // Generate, hash, store
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60_000); // 10 min

  const supabase = createServiceClient();

  // Invalidate any older un-consumed OTPs for this phone+purpose
  await supabase
    .from('otp_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('phone', phone)
    .eq('purpose', purpose)
    .is('consumed_at', null);

  const { error: insertError } = await supabase.from('otp_codes').insert({
    phone,
    code_hash: codeHash,
    purpose,
    expires_at: expiresAt.toISOString(),
    ip_address: ip === 'unknown' ? null : ip,
    user_agent: request.headers.get('user-agent') ?? null,
  });

  if (insertError) {
    console.error('[otp/request] DB insert failed:', insertError);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }

  // Fire-and-forget SMS — log on failure but don't block the user
  const sms = await sendOtp(phone, code);
  if (!sms.success) {
    return NextResponse.json(
      { error: sms.error ?? 'Failed to send SMS. Please try again.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, expiresIn: 600 });
}
