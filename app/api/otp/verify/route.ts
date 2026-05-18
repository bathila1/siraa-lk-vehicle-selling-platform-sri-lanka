import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { otpVerifySchema } from '@/lib/validations/schemas';
import { rateLimitOtpVerify } from '@/lib/auth/rate-limit';
import { setSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = otpVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }

  const { phone, code, purpose } = parsed.data;

  // Rate limit verify attempts (brute-force protection)
  const rl = rateLimitOtpVerify(phone);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please request a new code.' },
      { status: 429 },
    );
  }

  const supabase = createServiceClient();

  // Find the most recent un-consumed OTP for this phone+purpose
  const { data: otp } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp) {
    return NextResponse.json(
      { error: 'Code expired or invalid. Please request a new one.' },
      { status: 400 },
    );
  }

  // Increment attempts
  if (otp.attempts >= 5) {
    await supabase
      .from('otp_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', otp.id);
    return NextResponse.json(
      { error: 'Too many wrong tries. Please request a new code.' },
      { status: 429 },
    );
  }

  const ok = await bcrypt.compare(code, otp.code_hash);
  if (!ok) {
    await supabase
      .from('otp_codes')
      .update({ attempts: otp.attempts + 1 })
      .eq('id', otp.id);
    return NextResponse.json({ error: 'Wrong code. Try again.' }, { status: 400 });
  }

  // Mark OTP consumed
  await supabase
    .from('otp_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', otp.id);

  // Look up or create seller
  let { data: seller } = await supabase
    .from('sellers')
    .select('id, full_name, banned_at')
    .eq('phone', phone)
    .maybeSingle();

  // If banned — reject
  if (seller?.banned_at) {
    return NextResponse.json(
      { error: 'This account has been suspended. Please contact support.' },
      { status: 403 },
    );
  }

  // First-time signup → create skeleton seller row (full_name filled later via profile setup)
  if (!seller) {
    const { data: newSeller, error } = await supabase
      .from('sellers')
      .insert({
        phone,
        full_name: 'New Seller', // placeholder until profile setup
        verified_at: new Date().toISOString(),
      })
      .select('id, full_name, banned_at')
      .single();

    if (error || !newSeller) {
      console.error('[otp/verify] Failed to create seller:', error);
      return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
    }
    seller = newSeller;
  } else {
    // Mark verified + update last_seen
    await supabase
      .from('sellers')
      .update({ verified_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
      .eq('id', seller.id);
  }

  // Issue session
  await setSession({ seller_id: seller.id, phone });

  return NextResponse.json({
    ok: true,
    needsProfile: seller.full_name === 'New Seller',
  });
}
