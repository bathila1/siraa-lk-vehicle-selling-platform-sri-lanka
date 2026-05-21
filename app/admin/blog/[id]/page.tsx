import { redirect, notFound } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { BlogEditor } from '@/components/admin/BlogEditor';
import { getAdminSession } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: Props) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { id } = await params;
  const postId = parseInt(id);
  if (isNaN(postId)) notFound();

  const supabase = createServiceClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!post) notFound();

  return (
    <AdminShell title={`Edit: ${(post as any).title}`}>
      <BlogEditor post={post as any} />
    </AdminShell>
  );
}
