import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/admin-session';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/auth/audit-log';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const postId = parseInt(id);
  if (isNaN(postId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  if (body.action === 'publish') {
    await supabase
      .from('blog_posts')
      .update({ published: true, published_at: now } as any)
      .eq('id', postId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'blog.publish',
      targetType: 'blog_post',
      targetId: postId,
    });
  } else if (body.action === 'unpublish') {
    await supabase
      .from('blog_posts')
      .update({ published: false } as any)
      .eq('id', postId);

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'blog.unpublish',
      targetType: 'blog_post',
      targetId: postId,
    });
  } else if (body.action === 'update') {
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const slug = String(body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Check slug uniqueness (excluding self)
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .neq('id', postId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Another post already uses this slug.' },
        { status: 409 },
      );
    }

    const patch: any = {
      title: body.title,
      slug,
      excerpt: body.excerpt ?? null,
      content: body.content,
      cover_image_url: body.cover_image_url ?? null,
      meta_description: body.meta_description ?? null,
      author_name: body.author_name ?? null,
      updated_at: now,
    };

    // Allow publish state toggle in same update
    if (body.published === true) {
      patch.published = true;
      // Only set published_at if it wasn't set before
      const { data: cur } = await supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', postId)
        .single();
      if (!(cur as any)?.published_at) {
        patch.published_at = now;
      }
    } else if (body.published === false) {
      patch.published = false;
    }

    const { error } = await supabase
      .from('blog_posts')
      .update(patch)
      .eq('id', postId);

    if (error) {
      console.error('[blog PATCH]', error);
      return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
    }

    await logAuditEvent({
      adminId: session.admin_id,
      action: 'blog.update',
      targetType: 'blog_post',
      targetId: postId,
    });
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const postId = parseInt(id);
  if (isNaN(postId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const supabase = createServiceClient();
  await supabase.from('blog_posts').delete().eq('id', postId);

  await logAuditEvent({
    adminId: session.admin_id,
    action: 'blog.delete',
    targetType: 'blog_post',
    targetId: postId,
  });

  return NextResponse.json({ ok: true });
}
