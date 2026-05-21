'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Trash2, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { MarkdownBody } from '@/components/blog/MarkdownBody';

interface Props {
  post?: {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    cover_image_url: string | null;
    meta_description: string | null;
    author_name: string | null;
    published: boolean;
  };
}

export function BlogEditor({ post }: Props) {
  const router = useRouter();
  const isNew = !post;

  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [coverUrl, setCoverUrl] = useState(post?.cover_image_url ?? '');
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? '');
  const [authorName, setAuthorName] = useState(post?.author_name ?? 'Siraa Team');

  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Auto-slug from title for new posts only
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (isNew && !slug) {
      const auto = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
      setSlug(auto);
    }
  };

  const save = async (publish?: boolean) => {
    setError(null);
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError('Title, slug, and content are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content,
        cover_image_url: coverUrl.trim() || null,
        meta_description: metaDescription.trim() || null,
        author_name: authorName.trim() || null,
        ...(publish !== undefined && { published: publish }),
      };

      const res = isNew
        ? await fetch('/api/admin/blog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/blog/${post!.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', ...payload }),
          });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Save failed.');
        return;
      }

      setSavedAt(Date.now());

      if (isNew && data.id) {
        router.push(`/admin/blog/${data.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm('Delete this post permanently?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/blog');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--brand-green)]"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to all posts
      </Link>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--brand-bg)] px-4 py-2 md:-mx-6 md:px-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs hover:border-[var(--brand-green)]"
          >
            <Eye className="h-3 w-3" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>

          {post?.published && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs hover:border-[var(--brand-green)]"
            >
              <ExternalLink className="h-3 w-3" />
              View live
            </Link>
          )}

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {savedAt && Date.now() - savedAt < 5000 && (
            <span className="text-xs text-[var(--brand-green)]">✓ Saved</span>
          )}
          <Button variant="outline" size="sm" onClick={() => save()} loading={saving}>
            <Save className="h-3.5 w-3.5" />
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => save(true)}
            loading={saving}
          >
            {post?.published ? 'Update Published' : 'Publish'}
          </Button>
        </div>
      </div>

      {showPreview ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-6">
          <h1 className="mb-3 text-3xl font-bold text-[var(--brand-deep)]">{title || 'Untitled'}</h1>
          {excerpt && <p className="mb-5 text-lg text-gray-600">{excerpt}</p>}
          {coverUrl && (
            <img src={coverUrl} alt="" className="mb-5 aspect-video w-full rounded-xl object-cover" />
          )}
          <MarkdownBody content={content} />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Main content column */}
          <div className="space-y-3 lg:col-span-2">
            <Field label="Title *">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="How to value a used Toyota Aqua in Sri Lanka"
                maxLength={200}
                className="input text-base font-semibold"
              />
            </Field>

            <Field label="Excerpt (shown in listings & search results)">
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short 1-2 sentence summary..."
                maxLength={300}
                rows={2}
                className="input resize-none"
              />
              <p className="mt-1 text-[10px] text-gray-400">{excerpt.length}/300</p>
            </Field>

            <Field label="Content (Markdown) *">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`# Heading\n\nParagraph text. **Bold** and *italic* supported.\n\n- List items\n- Like this\n\n[Link text](https://example.com)\n\n![Image alt](https://example.com/img.jpg)`}
                rows={20}
                className="input resize-y font-mono text-sm"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Markdown: # heading, **bold**, *italic*, [link](url), ![img](url), - lists, &gt; quote, ```code```
              </p>
            </Field>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <Field label="Slug (URL) *">
              <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-gray-50 px-2">
                <span className="text-xs text-gray-400">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80))
                  }
                  className="flex-1 bg-transparent py-2 text-sm font-mono outline-none"
                />
              </div>
            </Field>

            <Field label="Cover image URL">
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="input"
              />
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt=""
                  className="mt-2 aspect-video w-full rounded-lg object-cover"
                />
              )}
            </Field>

            <Field label="Author name">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Siraa Team"
                maxLength={80}
                className="input"
              />
            </Field>

            <Field label="Meta description (SEO)">
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Optional — uses excerpt if empty. Max 160 chars."
                maxLength={160}
                rows={3}
                className="input resize-none text-xs"
              />
              <p className="mt-1 text-[10px] text-gray-400">{metaDescription.length}/160</p>
            </Field>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          outline: none;
          background: white;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: var(--brand-green);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
