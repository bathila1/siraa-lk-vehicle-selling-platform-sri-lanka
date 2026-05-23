import { NextRequest, NextResponse } from 'next/server';

import { reportSchema } from '@/lib/validations/schemas';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { verifyTurnstileToken } from '@/lib/auth/turnstile';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  // Rate limit reports
  const rl = await rateLimit(`report:${ip}`, RATE_LIMITS.reports);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many reports. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data.' }, { status: 400 });
  }

  // Bot check — reports are unauthenticated so this is the primary defense
  const captchaOk = await verifyTurnstileToken(parsed.data.captchaToken, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: 'Bot check failed.' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('reports').insert({
    vehicle_id: parsed.data.vehicleId,
    reason: parsed.data.reason,
    reporter_phone: parsed.data.reporterPhone ?? null,
    reporter_name: parsed.data.reporterName ?? null,
    notes: parsed.data.notes ?? null,
    ip_address: ip === 'unknown' ? null : ip,
  } as any);

  if (error) {
    console.error('[reports POST] Failed:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
