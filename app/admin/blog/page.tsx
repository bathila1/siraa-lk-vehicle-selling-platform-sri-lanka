import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/auth/admin-session';

export default async function BlogAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <AdminShell title="Blog Posts" subtitle="Write SEO content to drive organic traffic.">
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Blog CRUD UI coming in a future release. Use Supabase Table Editor for now.
        </p>
        <Link
          href="https://supabase.com/dashboard/project/bdyyzfawulwlqxzrfgtb/editor"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-green)] hover:underline"
        >
          Open Table Editor
          <ExternalLink className="w-3 h-3" />
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Table: <code className="bg-gray-100 px-1 py-0.5 rounded">blog_posts</code> · Set <code>published=true</code> to make live.
        </p>
      </div>
    </AdminShell>
  );
}
