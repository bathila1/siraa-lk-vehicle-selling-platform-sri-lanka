import { NextRequest, NextResponse } from 'next/server';

import { verifyIpnSignature, PAYHERE_STATUS_MAP, type PayHereStatusCode } from '@/lib/payhere/hash';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * PayHere Instant Payment Notification webhook.
 * Called server-to-server by PayHere — NOT by the user's browser.
 * Security comes from the md5sig signature, not auth.
 *
 * Spec: https://support.payhere.lk/api-&-mobile-sdk/checkout-api
 */
export async function POST(request: NextRequest) {
  // PayHere sends application/x-www-form-urlencoded
  let body: FormData;
  try {
    body = await request.formData();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const merchantId = body.get('merchant_id') as string | null;
  const orderId = body.get('order_id') as string | null;
  const paymentId = body.get('payment_id') as string | null;
  const payhereAmount = body.get('payhere_amount') as string | null;
  const payhereCurrency = body.get('payhere_currency') as string | null;
  const statusCode = body.get('status_code') as string | null;
  const md5sig = body.get('md5sig') as string | null;
  const statusMessage = body.get('status_message') as string | null;
  const method = body.get('method') as string | null;

  // Required fields check
  if (!merchantId || !orderId || !payhereAmount || !payhereCurrency || !statusCode || !md5sig) {
    console.warn('[payhere ipn] Missing required fields');
    return new Response('Missing fields', { status: 400 });
  }

  // Verify signature
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;
  const valid = verifyIpnSignature({
    merchantId,
    merchantSecret,
    orderId,
    payhereAmount,
    payhereCurrency,
    statusCode,
    receivedMd5Sig: md5sig,
  });

  if (!valid) {
    console.error('[payhere ipn] Signature verification failed for order:', orderId);
    return new Response('Invalid signature', { status: 400 });
  }

  // Verify merchant_id matches our config (defense in depth)
  if (merchantId !== process.env.PAYHERE_MERCHANT_ID) {
    console.error('[payhere ipn] Merchant ID mismatch');
    return new Response('Invalid merchant', { status: 400 });
  }

  const supabase = createServiceClient();

  // Look up our payment row
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, amount, seller_id')
    .eq('gateway_order_id', orderId)
    .single();

  if (!payment) {
    console.error('[payhere ipn] Unknown order_id:', orderId);
    return new Response('Order not found', { status: 404 });
  }

  // Idempotency — already completed = nothing to do
  if (payment.status === 'completed') {
    return new Response('OK', { status: 200 });
  }

  // Verify amount matches (defense in depth — signature should already cover this)
  const amountReceived = parseFloat(payhereAmount);
  if (Math.abs(amountReceived - payment.amount) > 0.01) {
    console.error('[payhere ipn] Amount mismatch:', {
      expected: payment.amount,
      received: amountReceived,
      orderId,
    });
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        ipn_received_at: new Date().toISOString(),
        raw_response: {
          status_code: statusCode,
          status_message: statusMessage,
          error: 'amount_mismatch',
        } as any,
      })
      .eq('id', payment.id);
    return new Response('Amount mismatch', { status: 400 });
  }

  // Map status code
  const mapped = PAYHERE_STATUS_MAP[statusCode as PayHereStatusCode];
  if (!mapped) {
    console.error('[payhere ipn] Unknown status_code:', statusCode);
    return new Response('Unknown status', { status: 400 });
  }

  const rawResponse = {
    merchant_id: merchantId,
    order_id: orderId,
    payment_id: paymentId,
    payhere_amount: payhereAmount,
    payhere_currency: payhereCurrency,
    status_code: statusCode,
    status_message: statusMessage,
    method,
  };

  // Update payment
  await supabase
    .from('payments')
    .update({
      status: mapped.payment,
      gateway_payment_id: paymentId,
      ipn_received_at: new Date().toISOString(),
      completed_at: mapped.payment === 'completed' ? new Date().toISOString() : null,
      raw_response: rawResponse as any,
    })
    .eq('id', payment.id);

  // Update linked boost based on payment outcome
  if (mapped.payment === 'completed') {
    // Activate — fresh starts_at/expires_at from now
    const { data: boost } = await supabase
      .from('boosts')
      .select('id, plan_id, boost_plans(duration_days)')
      .eq('payment_id', payment.id)
      .single();

    if (boost) {
      const durationDays = (boost as any).boost_plans?.duration_days ?? 7;
      const startsAt = new Date();
      const expiresAt = new Date(startsAt.getTime() + durationDays * 86400_000);

      await supabase
        .from('boosts')
        .update({
          status: 'active',
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', boost.id);
    }
  } else if (mapped.payment === 'cancelled' || mapped.payment === 'failed') {
    // Cancel the linked boost
    await supabase.from('boosts').update({ status: 'cancelled' }).eq('payment_id', payment.id);
  } else if (mapped.payment === 'refunded') {
    // Mark boost cancelled but keep payment record as refunded for audit
    await supabase.from('boosts').update({ status: 'cancelled' }).eq('payment_id', payment.id);
  }

  return new Response('OK', { status: 200 });
}
