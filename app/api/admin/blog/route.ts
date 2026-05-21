import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.slug || !body?.content) {
    return NextResponse.json(
      { error: 'Title, slug, and content are required.' },
      { status: 400 },
    );
  }

  // Slug must be url-safe and unique
  const slug = String(body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!slug) return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });

  const supabase = createServiceClient();

  // Check uniqueness
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'A post with this slug already exists.' },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const willPublish = body.published === true;

  const { data: created, error } = await supabase
    .from('blog_posts')
    .insert({
      slug,
      title: body.title,
      excerpt: body.excerpt ?? null,
      content: body.content,
      cover_image_url: body.cover_image_url ?? null,
      meta_description: body.meta_description ?? null,
      author_name: body.author_name ?? null,
      author_admin_id: session.admin_id,
      published: willPublish,
      published_at: willPublish ? now : null,
    } as any)
    .select('id')
    .single();

  if (error || !created) {
    console.error('[blog POST]', error);
    return NextResponse.json({ error: 'Save failed.' }, { status: 500 });
  }

  await logAuditEvent({
    adminId: session.admin_id,
    action: willPublish ? 'blog.create_and_publish' : 'blog.create_draft',
    targetType: 'blog_post',
    targetId: (created as any).id,
    details: { slug, title: body.title },
  });

  return NextResponse.json({ ok: true, id: (created as any).id, slug });
}
