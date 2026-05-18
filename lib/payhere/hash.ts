import { createHash } from 'node:crypto';

/**
 * PayHere uses MD5 with a specific concatenation. Spec reference:
 * https://support.payhere.lk/api-&-mobile-sdk/checkout-api
 *
 * IMPORTANT: All hashing is server-side only. The merchant_secret must
 * never reach the browser. These helpers are server-only.
 */

const md5Upper = (input: string): string =>
  createHash('md5').update(input, 'utf8').digest('hex').toUpperCase();

/**
 * Hash to send with the initial checkout form POST.
 *
 *   hash = uppercase(md5(
 *     merchant_id + order_id + amount(2dp) + currency + uppercase(md5(secret))
 *   ))
 *
 * The amount must be formatted to exactly two decimal places — "500" will
 * silently produce a different hash than "500.00" and your payment will be
 * rejected by PayHere with a generic error.
 */
export function generateCheckoutHash(input: {
  merchantId: string;
  merchantSecret: string;
  orderId: string;
  amount: number;
  currency?: string;
}): string {
  const currency = input.currency ?? 'LKR';
  const amountStr = input.amount.toFixed(2);
  const hashedSecret = md5Upper(input.merchantSecret);

  return md5Upper(
    `${input.merchantId}${input.orderId}${amountStr}${currency}${hashedSecret}`,
  );
}

/**
 * Verify the IPN (Instant Payment Notification) signature PayHere sends to
 * notify_url. NEVER trust an IPN whose signature doesn't verify.
 *
 *   md5sig = uppercase(md5(
 *     merchant_id + order_id + payhere_amount + payhere_currency
 *     + status_code + uppercase(md5(secret))
 *   ))
 *
 * Note: payhere_amount is provided by PayHere as a string already formatted —
 * we must use it as-is, not re-format. Same for currency and status_code.
 */
export function verifyIpnSignature(input: {
  merchantId: string;
  merchantSecret: string;
  orderId: string;
  payhereAmount: string;     // exactly as PayHere sent it
  payhereCurrency: string;   // exactly as PayHere sent it
  statusCode: string;        // exactly as PayHere sent it
  receivedMd5Sig: string;
}): boolean {
  const hashedSecret = md5Upper(input.merchantSecret);
  const local = md5Upper(
    `${input.merchantId}${input.orderId}${input.payhereAmount}${input.payhereCurrency}${input.statusCode}${hashedSecret}`,
  );

  // Constant-time comparison is not strictly required since md5sig is not a
  // secret per se, but timing-safe equality is a cheap defense.
  if (local.length !== input.receivedMd5Sig.length) return false;
  let diff = 0;
  for (let i = 0; i < local.length; i++) {
    diff |= local.charCodeAt(i) ^ input.receivedMd5Sig.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * PayHere status_code → our internal status mapping.
 * Reference: https://support.payhere.lk/api-&-mobile-sdk/checkout-api
 */
export type PayHereStatusCode = '2' | '0' | '-1' | '-2' | '-3';

export const PAYHERE_STATUS_MAP: Record<
  PayHereStatusCode,
  { label: string; payment: 'completed' | 'pending' | 'cancelled' | 'failed' | 'refunded' }
> = {
  '2':  { label: 'Success',        payment: 'completed' },
  '0':  { label: 'Pending',        payment: 'pending'   },
  '-1': { label: 'Cancelled',      payment: 'cancelled' },
  '-2': { label: 'Failed',         payment: 'failed'    },
  '-3': { label: 'Chargedback',    payment: 'refunded'  },
};

/**
 * Build an `order_id` that's short, URL-safe, and unique enough.
 * Format: siraa-{10 chars of nanoid alphabet}
 */
export function buildOrderId(shortId: string): string {
  return `siraa-${shortId}`;
}
