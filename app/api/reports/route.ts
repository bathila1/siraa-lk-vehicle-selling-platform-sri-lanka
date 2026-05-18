import { NextRequest, NextResponse } from 'next/server';

import { reportSchema } from '@/lib/validations/schemas';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/auth/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  // Rate limit reports — 5 per IP per hour
  const rl = rateLimit(`report:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many reports. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('reports').insert({
    vehicle_id: parsed.data.vehicleId,
    reason: parsed.data.reason,
    reporter_phone: parsed.data.reporterPhone ?? null,
    reporter_name: parsed.data.reporterName ?? null,
    notes: parsed.data.notes ?? null,
    ip_address: ip === 'unknown' ? null : ip,
  });

  if (error) {
    console.error('[reports POST] Failed:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
