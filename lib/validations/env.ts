import { z } from 'zod';

/**
 * Validates env vars at startup. If any required var is missing,
 * the app fails to boot with a clear message instead of dying mid-request.
 */

const serverSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // R2
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),

  // SMSLenz
  SMSLENZ_USER_ID: z.string().min(1),
  SMSLENZ_API_KEY: z.string().min(1),
  SMSLENZ_SENDER_ID: z.string().min(1).default('SMSlenzDEMO'),
  SMSLENZ_BASE_URL: z.string().url().default('https://smslenz.lk/api'),

  // PayHere
  PAYHERE_MERCHANT_ID: z.string().min(1),
  PAYHERE_MERCHANT_SECRET: z.string().min(1),
  PAYHERE_MODE: z.enum(['sandbox', 'live']).default('sandbox'),

  // Turnstile
  TURNSTILE_SECRET_KEY: z.string().min(1),

  // Session JWT signing
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars'),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_PAYHERE_CHECKOUT_URL: z.string().url(),
});

/**
 * Validate server-only env vars. Throws on missing keys.
 * Call from server entry points (route handlers, server components).
 */
export function getServerEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Server env vars validation failed. Check .env.local against .env.example');
  }
  return parsed.data;
}

/**
 * Validate public env vars. Safe to call from client.
 */
export function getClientEnv() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_PAYHERE_CHECKOUT_URL: process.env.NEXT_PUBLIC_PAYHERE_CHECKOUT_URL,
  };
  const parsed = clientSchema.safeParse(env);
  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Client env vars validation failed.');
  }
  return parsed.data;
}
