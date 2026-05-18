/**
 * Cloudflare Turnstile verification.
 * Free, invisible, no Pro tier needed.
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Verify a Turnstile token from the client.
 * Returns true if valid, false otherwise.
 * In development mode (no secret set), returns true to allow local testing.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // In dev without a secret, allow through (warn loudly)
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Turnstile] TURNSTILE_SECRET_KEY missing in production');
      return false;
    }
    console.warn('[Turnstile] No secret set — allowing token in dev');
    return true;
  }

  if (!token) return false;

  const body = new URLSearchParams();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteIp) body.append('remoteip', remoteIp);

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(5_000),
      },
    );
    const data = (await res.json()) as TurnstileResponse;
    if (!data.success) {
      console.warn('[Turnstile] Verification failed:', data['error-codes']);
    }
    return data.success === true;
  } catch (err) {
    console.error('[Turnstile] Network error:', err);
    return false;
  }
}
