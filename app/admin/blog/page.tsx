import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit3, ExternalLink } from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { BlogRowActions } from '@/components/admin/BlogRowActions';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

export default async function BlogAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, published, published_at, view_count, created_at, author_name')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <AdminShell
      title="Blog Posts"
      subtitle={`${posts?.length ?? 0} total`}
      actions={
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-green)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-deep)]"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      }
    >
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-bg)] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Author</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Views</th>
                <th className="px-3 py-2 text-left font-medium">Created</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(posts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <p className="mb-2">No posts yet</p>
                    <Link
                      href="/admin/blog/new"
                      className="text-sm text-[var(--brand-green)] hover:underline"
                    >
                      Write your first post →
                    </Link>
                  </td>
                </tr>
              ) : (
                (posts as any[]).map((post) => (
                  <tr key={post.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-medium hover:text-[var(--brand-green)]"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-gray-400 font-mono">/{post.slug}</p>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {post.author_name ?? 'Siraa Team'}
                    </td>
                    <td className="px-3 py-2">
                      {post.published ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">{post.view_count ?? 0}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {timeAgo(post.created_at)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {post.published && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </Link>
                        <BlogRowActions postId={post.id} published={post.published} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
