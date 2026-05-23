import { createServiceClient } from '@/lib/supabase/server';

/**
 * Persistent rate-limiting backed by Supabase.
 *
 * All limits are configurable via environment variables.
 * If an env var is not set, the sensible production default is used.
 *
 * To override in dev:
 *   .env.local → set the variable
 *
 * To override in production:
 *   Vercel → Settings → Environment Variables
 */

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// =============================================================================
// Configurable limits — env vars with safe defaults
// =============================================================================

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const RATE_LIMITS = {
  otpPerPhone: {
    limit: envInt('RL_OTP_PHONE_LIMIT', 3),
    windowMs: envInt('RL_OTP_PHONE_WINDOW_MIN', 10) * MINUTE,
  },
  otpPerIp: {
    limit: envInt('RL_OTP_IP_LIMIT', 10),
    windowMs: envInt('RL_OTP_IP_WINDOW_MIN', 10) * MINUTE,
  },
  otpVerify: {
    limit: envInt('RL_OTP_VERIFY_LIMIT', 5),
    windowMs: envInt('RL_OTP_VERIFY_WINDOW_MIN', 10) * MINUTE,
  },
  reports: {
    limit: envInt('RL_REPORT_LIMIT', 5),
    windowMs: envInt('RL_REPORT_WINDOW_MIN', 60) * MINUTE,
  },
  adminLogin: {
    limit: envInt('RL_ADMIN_LOGIN_LIMIT', 5),
    windowMs: envInt('RL_ADMIN_LOGIN_WINDOW_MIN', 15) * MINUTE,
  },
};

// =============================================================================
// Core rate limiter
// =============================================================================

/**
 * Generic rate limiter — uses the rate_limits table.
 * Fails OPEN on errors so legit users are never blocked due to infra issues.
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / options.windowMs) * options.windowMs);
  const resetAt = windowStart.getTime() + options.windowMs;

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc('increment_rate_limit' as any, {
      p_key: key,
      p_window_start: windowStart.toISOString(),
    });

    if (error) {
      // Fallback path if the RPC isn't available
      const { data: existing } = await supabase
        .from('rate_limits')
        .select('count')
        .eq('key', key)
        .eq('window_start', windowStart.toISOString())
        .maybeSingle();

      const newCount = ((existing as any)?.count ?? 0) + 1;

      await supabase
        .from('rate_limits')
        .upsert({
          key,
          window_start: windowStart.toISOString(),
          count: newCount,
        } as any);

      return {
        allowed: newCount <= options.limit,
        remaining: Math.max(0, options.limit - newCount),
        resetAt,
      };
    }

    const count = Number(data ?? 1);
    return {
      allowed: count <= options.limit,
      remaining: Math.max(0, options.limit - count),
      resetAt,
    };
  } catch (err) {
    console.error('[rateLimit] DB error, allowing request:', err);
    return { allowed: true, remaining: options.limit, resetAt };
  }
}

// =============================================================================
// OTP-specific helpers
// =============================================================================

/**
 * OTP request limit — two checks:
 * - Per phone (protects SMS credit)
 * - Per IP (stops floods on multiple phones from one IP)
 */
export async function rateLimitOtpRequest(
  phone: string,
  ip: string,
): Promise<RateLimitResult> {
  const supabase = createServiceClient();
  const { otpPerPhone, otpPerIp } = RATE_LIMITS;

  const windowAgo = new Date(Date.now() - otpPerPhone.windowMs).toISOString();
  const resetAt = Date.now() + otpPerPhone.windowMs;

  try {
    // Phone check via existing otp_codes table (no extra writes)
    const { count: phoneCount } = await supabase
      .from('otp_codes')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)
      .gt('created_at', windowAgo);

    if ((phoneCount ?? 0) >= otpPerPhone.limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    // IP check via generic rate_limits table
    const ipResult = await rateLimit(`otp:ip:${ip}`, otpPerIp);
    if (!ipResult.allowed) return ipResult;

    return {
      allowed: true,
      remaining: Math.max(0, otpPerPhone.limit - ((phoneCount ?? 0) + 1)),
      resetAt,
    };
  } catch (err) {
    console.error('[rateLimitOtpRequest] DB error, allowing:', err);
    return { allowed: true, remaining: otpPerPhone.limit, resetAt };
  }
}

/**
 * OTP verify attempts limit.
 */
export async function rateLimitOtpVerify(phone: string): Promise<RateLimitResult> {
  return rateLimit(`otp_verify:${phone}`, RATE_LIMITS.otpVerify);
}