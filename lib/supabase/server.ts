import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database';

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses the public anon key + the user's cookies.
 * Row Level Security policies enforce what this client can access.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — safely ignored,
            // middleware refreshes the session.
          }
        },
      },
    },
  );
}

/**
 * Admin/service-role client. BYPASSES Row Level Security.
 * NEVER expose this to the client. Use only in trusted server code
 * (admin routes, webhooks, cron jobs).
 */
export function createServiceClient() {
  const { createClient: createSupabaseClient } =
    require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
