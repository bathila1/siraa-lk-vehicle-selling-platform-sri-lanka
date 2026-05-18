/**
 * SMSLenz integration — Sri Lankan SMS gateway.
 * Used exclusively for phone OTP during seller signup and login.
 * Docs: https://smslenz.lk/api
 *
 * COST NOTE: Every OTP send costs SMS credit.
 * hCaptcha (invisible) must be verified BEFORE calling sendOtp()
 * to block bot-triggered OTP floods. Rate limiting in middleware
 * adds another layer (max 3 OTP requests per phone per 10 minutes).
 *
 * OTP lifecycle:
 *   1. App generates 6-digit code
 *   2. Code is bcrypt-hashed and stored in otp_codes table
 *   3. Raw code sent via SMS to seller's phone
 *   4. Seller submits raw code → app verifies against hash
 *   5. Verified OTP is marked consumed_at = now()
 *   6. Session created (seller logged in)
 *
 * Daily cron calls cleanup_expired_otps() to purge old rows.
 */

import { randomInt } from 'node:crypto';

interface SmsLenzResponse {
  success: boolean;
  message: string;
  data?: {
    status: string;
    campaign_id?: string;
    sms_credit_balance?: string;
  };
}

interface SendOtpResult {
  success: boolean;
  error?: string;
}

/**
 * Generate a cryptographically random 6-digit OTP code.
 * `randomInt` from Node crypto is uniform and unbiased.
 */
export function generateOtpCode(): string {
  return randomInt(100_000, 999_999).toString();
}

/**
 * Build the OTP SMS message body.
 * Keep it short — SMS charges per segment (160 chars).
 * The user owns this template.
 */
export function buildOtpMessage(code: string): string {
  return `Your Siraa.lk verification code is: ${code}\nValid for 10 minutes. Do not share this code.`;
}

/**
 * Send a single OTP via SMSLenz.
 * Phone must already be in +9476XXXXXXX format.
 */
export async function sendOtp(phone: string, code: string): Promise<SendOtpResult> {
  const userId = process.env.SMSLENZ_USER_ID!;
  const apiKey = process.env.SMSLENZ_API_KEY!;
  const senderId = process.env.SMSLENZ_SENDER_ID ?? 'SiraaLK';
  const baseUrl = process.env.SMSLENZ_BASE_URL ?? 'https://smslenz.lk/api';

  const message = buildOtpMessage(code);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        api_key: apiKey,
        sender_id: senderId,
        contact: phone,
        message,
      }),
      // Hard cap — we don't want a slow SMS API to block the user's login for 30s
      signal: AbortSignal.timeout(8_000),
    });
  } catch (err) {
    console.error('[SMSLenz] Network error:', err);
    return { success: false, error: 'SMS gateway unreachable. Please try again.' };
  }

  let body: SmsLenzResponse;
  try {
    body = (await response.json()) as SmsLenzResponse;
  } catch {
    console.error('[SMSLenz] Non-JSON response, status:', response.status);
    return { success: false, error: 'SMS gateway returned unexpected response.' };
  }

  if (!body.success) {
    console.error('[SMSLenz] API error:', body.message, body.data);
    return { success: false, error: 'Failed to send SMS. Please try again.' };
  }

  return { success: true };
}

/**
 * Fetch current SMS credit balance. Call from admin panel dashboard.
 * Not called in the user-facing request path.
 */
export async function fetchSmsCreditBalance(): Promise<string | null> {
  const userId = process.env.SMSLENZ_USER_ID!;
  const apiKey = process.env.SMSLENZ_API_KEY!;
  const baseUrl = process.env.SMSLENZ_BASE_URL ?? 'https://smslenz.lk/api';

  try {
    const res = await fetch(`${baseUrl}/account-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, api_key: apiKey }),
      signal: AbortSignal.timeout(5_000),
    });
    const body = (await res.json()) as SmsLenzResponse;
    return body.data?.sms_credit_balance ?? null;
  } catch {
    return null;
  }
}
