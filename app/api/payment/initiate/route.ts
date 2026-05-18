import { NextRequest, NextResponse } from 'next/server';

import { boostInitiateSchema } from '@/lib/validations/schemas';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { generateCheckoutHash, buildOrderId } from '@/lib/payhere/hash';
import { randomShortId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = boostInitiateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify vehicle ownership + active status
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, model, year, status, seller_id, vehicle_makes(name)')
    .eq('id', parsed.data.vehicleId)
    .single();

  if (!vehicle || vehicle.seller_id !== session.seller_id) {
    return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
  }
  if (vehicle.status !== 'active') {
    return NextResponse.json({ error: 'Vehicle is not active.' }, { status: 400 });
  }

  // Verify boost plan exists + active
  const { data: plan } = await supabase
    .from('boost_plans')
    .select('id, name, type, price, duration_days')
    .eq('id', parsed.data.planId)
    .eq('active', true)
    .single();

  if (!plan) {
    return NextResponse.json({ error: 'Boost plan unavailable.' }, { status: 404 });
  }

  // Check if vehicle already has an active boost — block duplicate purchase
  const { data: existing } = await supabase
    .from('boosts')
    .select('id, status')
    .eq('vehicle_id', vehicle.id)
    .in('status', ['pending', 'active'])
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'This vehicle already has an active or pending boost.' },
      { status: 409 },
    );
  }

  // Load seller details for PayHere form
  const { data: seller } = await supabase
    .from('sellers')
    .select('full_name, phone, district_id, city_id')
    .eq('id', session.seller_id)
    .single();

  if (!seller) return NextResponse.json({ error: 'Seller not found.' }, { status: 404 });

  // Generate order ID and compute durations
  const orderId   = buildOrderId(randomShortId(10));
  const startsAt  = new Date();
  const expiresAt = new Date(startsAt.getTime() + plan.duration_days * 86400_000);

  // Create payment + boost in a logical pair (no transaction needed — we
  // verify by gateway_order_id in the IPN handler)
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      seller_id:         session.seller_id,
      amount:            plan.price,
      currency:          'LKR',
      gateway:           'payhere',
      gateway_order_id:  orderId,
      status:            'pending',
    })
    .select('id')
    .single();

  if (paymentError || !payment) {
    console.error('[payment/initiate] Payment insert failed:', paymentError);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }

  const { error: boostError } = await supabase.from('boosts').insert({
    vehicle_id:  vehicle.id,
    plan_id:     plan.id,
    starts_at:   startsAt.toISOString(),
    expires_at:  expiresAt.toISOString(),
    status:      'pending',
    amount_paid: plan.price,
    payment_id:  payment.id,
  });

  if (boostError) {
    console.error('[payment/initiate] Boost insert failed:', boostError);
    // Roll back the payment row
    await supabase.from('payments').delete().eq('id', payment.id);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }

  // Build the PayHere form fields
  const merchantId     = process.env.PAYHERE_MERCHANT_ID!;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;
  const siteUrl        = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const checkoutUrl    = process.env.NEXT_PUBLIC_PAYHERE_CHECKOUT_URL
    ?? 'https://sandbox.payhere.lk/pay/checkout';

  const hash = generateCheckoutHash({
    merchantId,
    merchantSecret,
    orderId,
    amount: plan.price,
    currency: 'LKR',
  });

  const [firstName, ...rest] = seller.full_name.trim().split(/\s+/);
  const lastName = rest.join(' ') || firstName;

  const make = (vehicle as any).vehicle_makes?.name ?? '';
  const itemDesc = `${plan.name} for ${vehicle.year} ${make} ${vehicle.model}`.slice(0, 100);

  // Phone in 0771234567 format expected by PayHere
  const localPhone = seller.phone.startsWith('+94') ? '0' + seller.phone.slice(3) : seller.phone;

  const formFields = {
    merchant_id: merchantId,
    return_url:  `${siteUrl}/payment/return?order_id=${orderId}`,
    cancel_url:  `${siteUrl}/payment/cancel?order_id=${orderId}`,
    notify_url:  `${siteUrl}/api/payment/notify`,
    order_id:    orderId,
    items:       itemDesc,
    currency:    'LKR',
    amount:      plan.price.toFixed(2),
    first_name:  firstName || 'Customer',
    last_name:   lastName,
    email:       `noreply+${session.seller_id}@siraa.lk`,
    phone:       localPhone,
    address:     'Sri Lanka',
    city:        'Colombo',
    country:     'Sri Lanka',
    hash,
  };

  return NextResponse.json({
    checkoutUrl,
    fields: formFields,
    orderId,
    paymentId: payment.id,
  });
}
