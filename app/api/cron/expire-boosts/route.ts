import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Cron endpoint for expiring boosts + cleaning up stale pending payments.
 * Call this once per hour from Vercel Cron (or any external cron service).
 *
 * Auth: requires CRON_SECRET in the Authorization header so random callers can't trigger it.
 *
 * Vercel Cron config in vercel.json:
 *   {
 *     "crons": [{ "path": "/api/cron/expire-boosts", "schedule": "0 * * * *" }]
 *   }
 */
export async function GET(request: NextRequest) {
  // Auth check — accept Vercel Cron header OR bearer token
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
  const isAuthorized = isVercelCron || (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Expire active boosts that have passed their expires_at
  const { data: expired, error: expireError } = await supabase
    .from('boosts')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (expireError) {
    console.error('[cron] Expire boosts failed:', expireError);
  }

  // 2. Cancel pending payments older than 30 minutes (PayHere abandoned/timed out)
  const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
  const { data: stalePayments } = await supabase
    .from('payments')
    .select('id')
    .eq('status', 'pending')
    .lt('created_at', cutoff);

  let staleCount = 0;
  if (stalePayments && stalePayments.length > 0) {
    const ids = stalePayments.map((p) => p.id);

    // Mark payments as failed
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .in('id', ids);

    // Cancel linked pending boosts
    await supabase
      .from('boosts')
      .update({ status: 'cancelled' })
      .in('payment_id', ids)
      .eq('status', 'pending');

    staleCount = ids.length;
  }

  // 3. Cleanup expired OTPs and saved lists
  const { data: otpCount } = await supabase.rpc('cleanup_expired_otps' as any);
  const { data: listCount } = await supabase.rpc('cleanup_expired_saved_lists' as any);

  return NextResponse.json({
    ok: true,
    expired_boosts: expired?.length ?? 0,
    stale_payments_cancelled: staleCount,
    otps_cleaned: otpCount ?? 0,
    saved_lists_cleaned: listCount ?? 0,
    timestamp: new Date().toISOString(),
  });
}
