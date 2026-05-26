import { NextRequest, NextResponse } from 'next/server';

import { vehicleRequestSchema } from '@/lib/validations/vehicle-request';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/auth/rate-limit';
import { verifyTurnstileToken } from '@/lib/auth/turnstile';

/**
 * POST /api/requests
 *
 * Submit a vehicle request for admin to fulfil manually.
 * Unauthenticated endpoint — phone + Turnstile + rate limit + size cap.
 *
 * Security:
 *  - Body size limited by middleware (1MB)
 *  - Turnstile (Cloudflare) verifies human
 *  - Rate limit: 3 requests per phone per hour, 5 per IP per hour
 *  - All text fields length-capped via Zod schema
 *  - Phone normalized to +94 format (prevents duplicates)
 *  - No HTML rendering — text stored & shown as-is, no XSS risk
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? '';

  // 1. IP rate limit — 5 submissions per hour
  const ipRl = await rateLimit(`req:ip:${ip}`, {
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in an hour.' },
      { status: 429 },
    );
  }

  // 2. Parse + validate body
  const body = await request.json().catch(() => null);
  const parsed = vehicleRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? 'Invalid form data.' },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // 3. Per-phone rate limit — 3 per hour (after we have the normalized phone)
  const phoneRl = await rateLimit(`req:phone:${data.contactPhone}`, {
    limit: 3,
    windowMs: 60 * 60_000,
  });
  if (!phoneRl.allowed) {
    return NextResponse.json(
      { error: "You've already submitted recently. We'll be in touch soon!" },
      { status: 429 },
    );
  }

  // 4. Turnstile (Cloudflare) — verifies human
  const captchaOk = await verifyTurnstileToken(data.captchaToken, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: 'Bot check failed. Please try again.' }, { status: 403 });
  }

  // 5. Sanity: budget min ≤ max if both set
  if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
    return NextResponse.json(
      { error: 'Min budget cannot be more than max budget.' },
      { status: 400 },
    );
  }
  if (data.yearMin && data.yearMax && data.yearMin > data.yearMax) {
    return NextResponse.json(
      { error: 'Min year cannot be more than max year.' },
      { status: 400 },
    );
  }

  // 6. Insert
  const supabase = createServiceClient();
  const { error } = await supabase.from('vehicle_requests').insert({
    contact_phone: data.contactPhone,
    contact_name: data.contactName ?? null,
    whatsapp_pref: data.whatsappPref,
    vehicle_type_id: data.vehicleTypeId,
    make: data.make ?? null,
    model: data.model ?? null,
    year_min: data.yearMin ?? null,
    year_max: data.yearMax ?? null,
    budget_min: data.budgetMin ?? null,
    budget_max: data.budgetMax ?? null,
    fuel_type: data.fuelType ?? null,
    transmission: data.transmission ?? null,
    condition: data.condition ?? null,
    district_id: data.districtId ?? null,
    city_id: data.cityId ?? null,
    description: data.description ?? null,
    source: data.source,
    source_query: data.sourceQuery ?? null,
    status: 'new',
    ip_address: ip === 'unknown' ? null : ip,
    user_agent: userAgent.slice(0, 500), // truncate to prevent abuse
  } as any);

  if (error) {
    console.error('[vehicle-request POST]', error);
    return NextResponse.json({ error: 'Server error. Try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
