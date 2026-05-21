import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { BlogEditor } from '@/components/admin/BlogEditor';
import { getAdminSession } from '@/lib/auth/admin-session';

export default async function NewBlogPostPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <AdminShell title="New Blog Post">
      <BlogEditor />
    </AdminShell>
  );
}
