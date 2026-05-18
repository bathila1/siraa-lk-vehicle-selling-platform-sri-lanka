/**
 * Simple in-memory rate limiter — sliding window per key.
 *
 * Trade-offs:
 *  - Resets on every server restart/deploy (acceptable; combined with hCaptcha/Turnstile this is enough)
 *  - Per-instance only — when scaled to multiple instances, each has its own counter (also acceptable for MVP)
 *
 * For production scale, swap with Upstash Redis later.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup of expired buckets — prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets.entries()) {
    if (b.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref?.();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check + record a hit for `key` (e.g., IP + endpoint).
 * Returns { allowed: false } if over the limit.
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  if (bucket.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: options.limit - bucket.count, resetAt: bucket.resetAt };
}

/** Convenience preset for OTP requests — 3 per phone per 10 minutes */
export function rateLimitOtpRequest(phone: string, ip: string): RateLimitResult {
  // Both phone + IP — whichever trips first
  const a = rateLimit(`otp:phone:${phone}`, { limit: 3, windowMs: 10 * 60_000 });
  if (!a.allowed) return a;
  return rateLimit(`otp:ip:${ip}`, { limit: 10, windowMs: 10 * 60_000 });
}

/** OTP verify — 5 attempts per phone per 10 min (locks brute force) */
export function rateLimitOtpVerify(phone: string): RateLimitResult {
  return rateLimit(`otp:verify:${phone}`, { limit: 5, windowMs: 10 * 60_000 });
}
