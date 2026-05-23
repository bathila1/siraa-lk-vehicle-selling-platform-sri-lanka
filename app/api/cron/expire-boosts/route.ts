import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Cron endpoint — runs hourly (or daily). Does several maintenance tasks:
 *  1. Expire active boosts past their expires_at, and notify their sellers
 *  2. Cancel stale pending payments (PayHere abandoned)
 *  3. Send "boost expiring soon" notifications (within 24h)
 *  4. Cleanup: expired OTPs, saved lists, rate_limits, old notifications
 *
 * Auth: requires CRON_SECRET in Authorization header (or Vercel-Cron UA).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
  const isAuthorized = isVercelCron || (cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  // ===== 1. Expire active boosts =====
  // Get expired boosts WITH vehicle/seller info so we can notify
  const { data: expiringBoosts } = await supabase
    .from('boosts')
    .select(
      `
      id, vehicle_id, expires_at,
      boost_plans ( name, type ),
      vehicles ( slug, model, year, seller_id, vehicle_makes ( name ) )
    `,
    )
    .eq('status', 'active')
    .lt('expires_at', now.toISOString());

  let expiredCount = 0;
  if (expiringBoosts && expiringBoosts.length > 0) {
    const ids = (expiringBoosts as any[]).map((b) => b.id);
    await supabase.from('boosts').update({ status: 'expired' } as any).in('id', ids);
    expiredCount = ids.length;

    // Notify each affected seller
    const notifications = (expiringBoosts as any[])
      .filter((b) => b.vehicles?.seller_id)
      .map((b) => ({
        seller_id: b.vehicles.seller_id,
        category: 'boost_expired',
        title: `${b.boost_plans?.name ?? 'Boost'} expired`,
        body: `Your boost on ${b.vehicles.year} ${b.vehicles.vehicle_makes?.name ?? ''} ${b.vehicles.model} has ended. You can boost again to get more visibility.`,
        link_url: `/dashboard/boost/${b.vehicle_id}`,
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications as any);
    }
  }

  // ===== 2. Notify boosts expiring soon (within 24h) =====
  const soonCutoff = new Date(now.getTime() + 24 * 60 * 60_000).toISOString();
  const { data: expiringSoon } = await supabase
    .from('boosts')
    .select(
      `
      id, vehicle_id, expires_at,
      boost_plans ( name ),
      vehicles ( slug, model, year, seller_id, vehicle_makes ( name ) )
    `,
    )
    .eq('status', 'active')
    .gt('expires_at', now.toISOString())
    .lt('expires_at', soonCutoff);

  let soonNotified = 0;
  if (expiringSoon && expiringSoon.length > 0) {
    // Only notify if we haven't already (check for existing notif within last 24h)
    for (const b of expiringSoon as any[]) {
      if (!b.vehicles?.seller_id) continue;

      const { count: existing } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', b.vehicles.seller_id)
        .eq('category', 'boost_expires_soon')
        .gt('created_at', new Date(now.getTime() - 24 * 60 * 60_000).toISOString());

      if ((existing ?? 0) > 0) continue;

      await supabase.from('notifications').insert({
        seller_id: b.vehicles.seller_id,
        category: 'boost_expires_soon',
        title: 'Boost expiring soon',
        body: `Your ${b.boost_plans?.name ?? 'boost'} on ${b.vehicles.year} ${b.vehicles.vehicle_makes?.name ?? ''} ${b.vehicles.model} expires in less than 24 hours.`,
        link_url: `/dashboard/boost/${b.vehicle_id}`,
      } as any);
      soonNotified++;
    }
  }

  // ===== 3. Cancel stale pending payments =====
  const cutoff = new Date(now.getTime() - 30 * 60_000).toISOString();
  const { data: stalePayments } = await supabase
    .from('payments')
    .select('id')
    .eq('status', 'pending')
    .lt('created_at', cutoff);

  let staleCount = 0;
  if (stalePayments && stalePayments.length > 0) {
    const ids = stalePayments.map((p) => p.id);
    await supabase.from('payments').update({ status: 'failed' } as any).in('id', ids);
    await supabase
      .from('boosts')
      .update({ status: 'cancelled' } as any)
      .in('payment_id', ids)
      .eq('status', 'pending');
    staleCount = ids.length;
  }

  // ===== 4. Cleanup tasks =====
  const { data: otpCount } = await supabase.rpc('cleanup_expired_otps' as any);
  const { data: listCount } = await supabase.rpc('cleanup_expired_saved_lists' as any);
  const { data: rlCount } = await supabase.rpc('cleanup_expired_rate_limits' as any);
  const { data: notifCount } = await supabase.rpc('cleanup_old_notifications' as any);

  return NextResponse.json({
    ok: true,
    expired_boosts: expiredCount,
    expiring_soon_notified: soonNotified,
    stale_payments_cancelled: staleCount,
    otps_cleaned: otpCount ?? 0,
    saved_lists_cleaned: listCount ?? 0,
    rate_limits_cleaned: rlCount ?? 0,
    notifications_cleaned: notifCount ?? 0,
    timestamp: now.toISOString(),
  });
}
