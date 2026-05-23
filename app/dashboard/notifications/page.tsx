import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Inbox } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { getSession } from '@/lib/auth/session';
import { createServiceClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/dashboard/notifications');

  const supabase = createServiceClient();
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, category, title, body, link_url, read_at, created_at')
    .eq('seller_id', session.seller_id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-6">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--brand-green)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to dashboard
        </Link>

        <h1 className="mb-5 text-xl font-bold">Notifications</h1>

        {!notifications || notifications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No notifications yet"
            description="We'll notify you when something happens with your ads."
            actionLabel="Back to dashboard"
            actionHref="/dashboard"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
            {(notifications as any[]).map((n) => {
              const inner = (
                <div
                  className={`flex gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-0 transition-colors ${
                    n.read_at ? 'bg-white' : 'bg-[var(--brand-bg)]'
                  } hover:bg-gray-50`}
                >
                  {!n.read_at && (
                    <span
                      className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--brand-green)]"
                      aria-label="Unread"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`leading-snug ${
                        n.read_at ? 'text-gray-700' : 'font-medium text-[var(--brand-black)]'
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.body && <p className="mt-1 text-sm text-gray-500">{n.body}</p>}
                    <p className="mt-1.5 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              );

              return n.link_url ? (
                <Link key={n.id} href={n.link_url}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
